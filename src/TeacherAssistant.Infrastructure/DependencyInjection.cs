using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Infrastructure.Persistence;
using TeacherAssistant.Infrastructure.Persistence.Repositories;
using TeacherAssistant.Infrastructure.Services.AI;
using TeacherAssistant.Infrastructure.Services.Auth;
using TeacherAssistant.Infrastructure.Services.Subjects;
using TeacherAssistant.Infrastructure.Services.Groups;
using TeacherAssistant.Infrastructure.Services.Students;
using TeacherAssistant.Infrastructure.Services.Payments;
using TeacherAssistant.Infrastructure.Services.Tenancy;
using TeacherAssistant.Infrastructure.Settings;

namespace TeacherAssistant.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. Configure Options
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<OpenAiSettings>(configuration.GetSection(OpenAiSettings.SectionName));
        services.Configure<PaymentSettings>(configuration.GetSection(PaymentSettings.SectionName));
        services.Configure<SeedSettings>(configuration.GetSection(SeedSettings.SectionName));

        // 2. Tenant context (scoped, one per request)
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantService>(sp => sp.GetRequiredService<TenantContext>());
        services.AddScoped<ITenantContextSetter>(sp => sp.GetRequiredService<TenantContext>());

        // 3. Database Context (SQL Server)
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=TeacherAssistantDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // 4. Register Core Infrastructure Services
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IPasswordHasher, PasswordHasherService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<ITenantManagementService, TenantManagementService>();
        services.AddScoped<DatabaseSeeder>();
        services.AddScoped<RichDemoDataSeeder>();
        services.AddScoped<ISubjectService, SubjectService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAIAssessmentService, OpenAiAssessmentService>();

        return services;
    }
}
