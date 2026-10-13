using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Infrastructure.Persistence;
using TeacherAssistant.Infrastructure.Services.AI;
using TeacherAssistant.Infrastructure.Services.Auth;
using TeacherAssistant.Infrastructure.Services.Courses;
using TeacherAssistant.Infrastructure.Services.Payments;
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

        // 2. Database Context (SQL Server)
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=TeacherAssistantDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // 3. Register Core Infrastructure Services
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAIAssessmentService, OpenAiAssessmentService>();

        return services;
    }
}
