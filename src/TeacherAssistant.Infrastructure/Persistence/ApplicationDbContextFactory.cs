using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence;

/// <summary>
/// Used by "dotnet ef" so migrations can be generated without starting the API.
/// The connection string is always read from configuration (appsettings or
/// environment variables), never hardcoded.
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured. " +
                "Set ConnectionStrings__DefaultConnection or add it to the API appsettings.json.");
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new ApplicationDbContext(options, new DesignTimeTenantService());
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true);

        // "dotnet ef" is often run from the repository root; the API owns the appsettings files.
        var apiDirectory = Path.Combine(Directory.GetCurrentDirectory(), "src", "TeacherAssistant.API");
        if (Directory.Exists(apiDirectory))
        {
            builder
                .AddJsonFile(Path.Combine(apiDirectory, "appsettings.json"), optional: true)
                .AddJsonFile(Path.Combine(apiDirectory, "appsettings.Development.json"), optional: true);
        }

        // Environment variables win, so local overrides never edit a file.
        builder.AddEnvironmentVariables();

        return builder.Build();
    }

    private sealed class DesignTimeTenantService : ITenantService
    {
        public Guid? TenantId => null;
        public string? Subdomain => null;
        public Tenant? Tenant => null;
        public bool HasTenant => false;
    }
}
