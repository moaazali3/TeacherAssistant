using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.API.Configuration;
using TeacherAssistant.API.Middlewares;
using TeacherAssistant.API.Services;
using TeacherAssistant.Application;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Domain.Enums;
using TeacherAssistant.Infrastructure;
using TeacherAssistant.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration["Environment"] = builder.Environment.EnvironmentName;

// 1. Add Clean Architecture Layers
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Add API Infrastructure Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.Configure<TenantResolutionOptions>(
    builder.Configuration.GetSection(TenantResolutionOptions.SectionName));

// 3. Controllers (validation failures also use the unified ApiResponse)
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .SelectMany(entry => entry.Value!.Errors.Select(error =>
                    string.IsNullOrWhiteSpace(error.ErrorMessage)
                        ? $"{entry.Key} is invalid."
                        : error.ErrorMessage))
                .ToList();

            var response = ApiResponse<object>.FailureResponse("Validation failed.", errors);
            return new BadRequestObjectResult(response);
        };
    });

// 4. CORS for the frontend (X-Tenant is allowed via AllowAnyHeader)
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => IsAllowedFrontendOrigin(origin, configuredOrigins))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. JWT Authentication
// No fallback secret: the configuration value is required and is validated at startup
// (after builder.Build, so test-host overrides are visible). Reading it inside the options
// delegate also keeps the signing key in sync with the final configuration.
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? string.Empty;

    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        // A tenant-scoped token is only valid on its own tenant.
        OnTokenValidated = context =>
        {
            var tokenTenant = context.Principal?.FindFirst("tenantId")?.Value;
            if (string.IsNullOrWhiteSpace(tokenTenant))
                return Task.CompletedTask;

            var currentTenantId = context.HttpContext.RequestServices
                .GetRequiredService<ITenantService>().TenantId;

            var tenantMismatch = currentTenantId is null ||
                !Guid.TryParse(tokenTenant, out var tokenTenantId) ||
                tokenTenantId != currentTenantId;

            if (tenantMismatch)
            {
                // Branding and landing updates run an explicit ownership check in the application
                // service so a foreign instructor gets 403. Every other endpoint keeps
                // the global 401 behaviour for a token used on another tenant.
                if (IsTenantManagementUpdateRequest(context.HttpContext))
                    return Task.CompletedTask;

                context.Fail("This token does not belong to the requested tenant.");
            }

            return Task.CompletedTask;
        },
        OnChallenge = async context =>
        {
            context.HandleResponse();
            if (context.Response.HasStarted) return;

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(
                ApiResponse<string>.FailureResponse("Authentication is required."));
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(
                ApiResponse<string>.FailureResponse("You do not have permission to perform this action."));
        }
    };
});

// 6. Role-based authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AdminOnly,
        policy => policy.RequireRole(nameof(UserRole.Admin)));
    options.AddPolicy(AuthorizationPolicies.InstructorOnly,
        policy => policy.RequireRole(nameof(UserRole.Instructor)));
    options.AddPolicy(AuthorizationPolicies.InstructorOrAssistant,
        policy => policy.RequireRole(nameof(UserRole.Instructor), nameof(UserRole.Assistant)));
    options.AddPolicy(AuthorizationPolicies.StudentOnly,
        policy => policy.RequireRole(nameof(UserRole.Student)));
});

// 7. Rate limiting (brute-force protection). Limits live in the "RateLimiting" section.
// The options are resolved per request so configuration overrides (tests, environment
// variables) are honoured no matter when they are added.
builder.Services.Configure<RateLimitingOptions>(
    builder.Configuration.GetSection(RateLimitingOptions.SectionName));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<string>.FailureResponse(RateLimitMessage(context.HttpContext.Request.Path)),
            cancellationToken);
    };

    options.AddPolicy(RateLimitPolicies.Login, context =>
    {
        var settings = CurrentRateLimitingOptions(context);
        return BuildPartition(
            settings.Enabled,
            $"login:{RateLimitPartitionMiddleware.LoginPartitionKey(context)}",
            settings.Login);
    });

    options.AddPolicy(RateLimitPolicies.JoinCode, context =>
    {
        var settings = CurrentRateLimitingOptions(context);
        return BuildPartition(
            settings.Enabled,
            $"join-code:{RateLimitPartitionMiddleware.ClientIp(context)}",
            settings.JoinCode);
    });

    options.AddPolicy(RateLimitPolicies.Public, context =>
    {
        var settings = CurrentRateLimitingOptions(context);
        return BuildPartition(
            settings.Enabled,
            $"public:{RateLimitPartitionMiddleware.ClientIp(context)}",
            settings.Public);
    });
});

// 8. OpenAPI / API Documentation (.NET 10 & Scalar)
builder.Services.AddOpenApi();

var app = builder.Build();

// Fail fast: a missing or short JWT secret must never silently fall back to a known value.
ValidateJwtSecret(builder.Configuration);

// 9. Migrate and seed the database (disabled in integration tests)
if (builder.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedAsync();
}

// 9b. Rich demo data (4 extra tenants + students) — opt-in via Database:SeedRichData=true
if (builder.Configuration.GetValue<bool>("Database:SeedRichData"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<RichDemoDataSeeder>().SeedAsync();
}

// 10. Middlewares
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("Scalar:Enabled"))
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Teacher Assistant LMS API")
               .WithTheme(ScalarTheme.Moon);
    });
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

var storagePath = Path.Combine(app.Environment.ContentRootPath, "storage");
Directory.CreateDirectory(storagePath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(storagePath),
    RequestPath = "/storage"
});

app.UseCors("Frontend");

// Buffer the login body first so its email can be part of the rate-limit partition.
// Limiting runs before tenant resolution and authentication so rejected traffic does no
// database work and never reaches the controllers.
app.UseMiddleware<RateLimitPartitionMiddleware>();
app.UseRateLimiter();

// Resolve the tenant before authentication so a token can be checked against it.
app.UseMiddleware<TenantResolutionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Map("/api/{**slug}", (HttpContext context) =>
    Results.Json(
        ApiResponse<string>.FailureResponse($"Endpoint '{context.Request.Path}' was not found."),
        statusCode: StatusCodes.Status404NotFound));
app.MapFallbackToFile("index.html");

app.Run();

static bool IsAllowedFrontendOrigin(string origin, string[] configuredOrigins)
{
    if (configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        return true;

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        return false;

    if (uri.Scheme is not ("http" or "https") || uri.Port != 5173)
        return false;

    // Allow localhost:5173 and any *.localhost:5173 during development.
    return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || uri.Host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase);
}

static void ValidateJwtSecret(IConfiguration configuration)
{
    var jwtSecret = configuration["JwtSettings:Secret"];

    if (string.IsNullOrWhiteSpace(jwtSecret))
    {
        throw new InvalidOperationException(
            "JwtSettings:Secret is not configured. Set it in appsettings.Development.json for local " +
            "development, or through the JwtSettings__Secret environment variable (or a secret store) " +
            "in other environments.");
    }

    if (jwtSecret.Length < 32)
    {
        throw new InvalidOperationException(
            "JwtSettings:Secret must be at least 32 characters long. " +
            "Configure a longer value in appsettings.Development.json or through JwtSettings__Secret.");
    }
}

static RateLimitingOptions CurrentRateLimitingOptions(HttpContext context)
    => context.RequestServices
        .GetRequiredService<IOptionsMonitor<RateLimitingOptions>>()
        .CurrentValue;

static RateLimitPartition<string> BuildPartition(
    bool enabled,
    string partitionKey,
    RateLimitRuleOptions rule)
{
    if (!enabled)
        return RateLimitPartition.GetNoLimiter("rate-limiting-disabled");

    return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = Math.Max(1, rule.PermitLimit),
        Window = TimeSpan.FromMinutes(Math.Max(1, rule.WindowMinutes)),
        QueueLimit = Math.Max(0, rule.QueueLimit),
        AutoReplenishment = true
    });
}

static string RateLimitMessage(PathString path)
{
    var value = path.Value ?? string.Empty;

    if (value.EndsWith("/auth/login", StringComparison.OrdinalIgnoreCase))
    {
        return "تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة مرة أخرى بعد دقيقة.";
    }

    if (value.EndsWith("/auth/register-student", StringComparison.OrdinalIgnoreCase) ||
        value.EndsWith("/groups/join", StringComparison.OrdinalIgnoreCase))
    {
        return "تم تجاوز عدد محاولات إدخال كود الانضمام المسموح بها. يرجى المحاولة مرة أخرى بعد قليل.";
    }

    return "تم تجاوز عدد الطلبات المسموح بها. يرجى المحاولة مرة أخرى لاحقًا.";
}

static bool IsTenantManagementUpdateRequest(HttpContext context)
{
    var path = context.Request.Path.Value?.TrimEnd('/');

    if (HttpMethods.IsPut(context.Request.Method))
    {
        return string.Equals(path, "/api/v1/tenants/current", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(path, "/api/v1/tenants/current/landing", StringComparison.OrdinalIgnoreCase);
    }

    if (HttpMethods.IsPost(context.Request.Method))
    {
        return string.Equals(path, "/api/v1/tenants/current/landing/reset", StringComparison.OrdinalIgnoreCase);
    }

    return false;
}

public partial class Program;
