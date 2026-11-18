using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Infrastructure.Persistence;

namespace TeacherAssistant.IntegrationTests;

/// <summary>
/// Boots the real API against a private in-memory SQLite database.
/// Auto-migration/seeding is disabled; the schema is created per test.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    private const string TestJwtSecret = "IntegrationTestsJwtSecretMustBeAtLeast32Chars!";

    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    private readonly IReadOnlyDictionary<string, string?> _settings;

    /// <summary>
    /// <paramref name="settings"/> overrides the test defaults, for example to relax or
    /// tighten a rate limit inside a dedicated test.
    /// </summary>
    public ApiFactory(IReadOnlyDictionary<string, string?>? settings = null)
    {
        _settings = settings ?? new Dictionary<string, string?>();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["Database:AutoMigrate"] = "false",
                ["JwtSettings:Secret"] = TestJwtSecret
            };

            foreach (var (key, value) in _settings)
                settings[key] = value;

            configuration.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<IApplicationDbContext>();

            _connection.Open();
            services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(_connection));
            services.AddScoped<IApplicationDbContext>(provider =>
                provider.GetRequiredService<ApplicationDbContext>());
        });
    }

    public async Task InitializeDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
            _connection.Dispose();
    }
}
