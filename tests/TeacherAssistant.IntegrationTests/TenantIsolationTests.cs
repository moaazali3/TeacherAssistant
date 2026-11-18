using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Tenants;
using TeacherAssistant.Infrastructure.Persistence;

namespace TeacherAssistant.IntegrationTests;

public class TenantIsolationTests : IAsyncLifetime
{
    private readonly ApiFactory _factory = new();

    public Task InitializeAsync() => _factory.InitializeDatabaseAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();

    [Fact]
    public async Task Student_from_tenant_A_cannot_login_on_tenant_B()
    {
        using var client = _factory.CreateClient();
        var teacherA = await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-a", "teacher-a@example.com");
        await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-b", "teacher-b@example.com");

        var (_, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            client, "tenant-a", teacherA.Token);

        var registration = await ApiTestHelpers.RegisterStudentAsync(
            client, "tenant-a", "student@example.com", joinCode);
        Assert.Equal(HttpStatusCode.OK, registration.StatusCode);

        var loginInOwnTenant = await ApiTestHelpers.LoginAsync(
            client, "tenant-a", "student@example.com");
        Assert.Equal(HttpStatusCode.OK, loginInOwnTenant.StatusCode);

        // The same credentials must not resolve on another tenant.
        var loginInOtherTenant = await ApiTestHelpers.LoginAsync(
            client, "tenant-b", "student@example.com");
        Assert.Equal(HttpStatusCode.Unauthorized, loginInOtherTenant.StatusCode);
    }

    [Fact]
    public async Task Same_email_is_allowed_in_two_different_tenants()
    {
        using var client = _factory.CreateClient();
        var teacherA = await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-a", "teacher-a@example.com");
        var teacherB = await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-b", "teacher-b@example.com");

        var (_, _, codeA) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            client, "tenant-a", teacherA.Token);
        var (_, _, codeB) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            client, "tenant-b", teacherB.Token);

        var inTenantA = await ApiTestHelpers.RegisterStudentAsync(
            client, "tenant-a", "shared@example.com", codeA);
        var inTenantB = await ApiTestHelpers.RegisterStudentAsync(
            client, "tenant-b", "shared@example.com", codeB);

        Assert.Equal(HttpStatusCode.OK, inTenantA.StatusCode);
        Assert.Equal(HttpStatusCode.OK, inTenantB.StatusCode);
    }

    [Fact]
    public async Task Branding_update_from_another_tenant_is_forbidden()
    {
        using var client = _factory.CreateClient();
        var teacherA = await ApiTestHelpers.RegisterTeacherAsync(
            client, "tenant-a", "teacher-a@example.com");
        await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-b", "teacher-b@example.com");

        // The owner of tenant A can update its own branding.
        var ownTenantUpdate = await ApiTestHelpers.UpdateCurrentTenantAsync(
            client, "tenant-a", teacherA.Token, new UpdateTenantBrandingDto { Name = "Renamed Academy" });
        Assert.Equal(HttpStatusCode.OK, ownTenantUpdate.StatusCode);

        // Tenant A's instructor cannot update tenant B's branding.
        var crossTenantUpdate = await ApiTestHelpers.UpdateCurrentTenantAsync(
            client, "tenant-b", teacherA.Token, new UpdateTenantBrandingDto { Name = "Hijacked" });
        Assert.Equal(HttpStatusCode.Forbidden, crossTenantUpdate.StatusCode);

        // Tenant B is untouched.
        var tenantB = await ApiTestHelpers.GetCurrentTenantAsync(client, "tenant-b");
        var tenantBBody = await tenantB.Content.ReadFromJsonAsync<ApiResponse<TenantBrandingDto>>();
        Assert.Equal("Academy tenant-b", tenantBBody!.Data!.Name);
    }

    [Fact]
    public async Task Tenant_token_is_still_401_on_other_tenant_endpoints()
    {
        using var client = _factory.CreateClient();
        var teacherA = await ApiTestHelpers.RegisterTeacherAsync(
            client, "tenant-a", "teacher-a@example.com");
        await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-b", "teacher-b@example.com");

        // Only the branding update defers the token/tenant mismatch to the service (403);
        // every other authenticated endpoint keeps rejecting it during authentication (401).
        var response = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/subjects/mine", "tenant-b", teacherA.Token));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_subdomain_returns_404_with_unified_api_response()
    {
        using var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/tenants/current");
        request.Headers.Add("X-Tenant", "does-not-exist");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<string>>();
        Assert.NotNull(body);
        Assert.False(body!.Success);
        Assert.Contains("does-not-exist", body.Message);
    }

    [Fact]
    public async Task Host_subdomain_is_used_when_X_Tenant_header_is_absent()
    {
        using var client = _factory.CreateClient();
        await ApiTestHelpers.RegisterTeacherAsync(client, "hosttenant", "teacher@example.com");

        var request = new HttpRequestMessage(
            HttpMethod.Get, "http://hosttenant.localhost/api/v1/tenants/current");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<TenantBrandingDto>>();
        Assert.NotNull(body);
        Assert.True(body!.Success);
        Assert.Equal("hosttenant", body.Data!.Subdomain);
    }

    [Fact]
    public async Task Global_query_filter_hides_users_of_other_tenants()
    {
        using var client = _factory.CreateClient();
        var teacherA = await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-a", "teacher-a@example.com");
        var teacherB = await ApiTestHelpers.RegisterTeacherAsync(client, "tenant-b", "teacher-b@example.com");

        var (_, _, codeA) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            client, "tenant-a", teacherA.Token);
        var (_, _, codeB) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            client, "tenant-b", teacherB.Token);

        await ApiTestHelpers.RegisterStudentAsync(client, "tenant-a", "student-a@example.com", codeA);
        await ApiTestHelpers.RegisterStudentAsync(client, "tenant-b", "student-b@example.com", codeB);

        using var scope = _factory.Services.CreateScope();
        var tenantRepository = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
        var tenant = await tenantRepository.GetBySubdomainAsync("tenant-a");
        Assert.NotNull(tenant);

        var setter = (ITenantContextSetter)scope.ServiceProvider.GetRequiredService<ITenantService>();
        setter.SetTenant(tenant!);

        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var visibleEmails = await dbContext.Users.Select(u => u.Email).ToListAsync();

        Assert.Contains("student-a@example.com", visibleEmails);
        Assert.DoesNotContain("student-b@example.com", visibleEmails);
    }

    [Fact]
    public async Task Inactive_tenant_returns_404()
    {
        using var client = _factory.CreateClient();
        await ApiTestHelpers.RegisterTeacherAsync(client, "sleeping", "teacher@example.com");

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var tenant = await dbContext.Tenants.SingleAsync(t => t.Subdomain == "sleeping");
            tenant.IsActive = false;
            await dbContext.SaveChangesAsync();
        }

        var response = await ApiTestHelpers.GetCurrentTenantAsync(client, "sleeping");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Cors_preflight_allows_frontend_origin_and_X_Tenant_header()
    {
        using var client = _factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/auth/login");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "x-tenant,content-type");

        var response = await client.SendAsync(request);

        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
        var allowedHeaders = string.Join(",", response.Headers.GetValues("Access-Control-Allow-Headers"));
        Assert.Contains("x-tenant", allowedHeaders, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Reserved_or_invalid_subdomains_are_not_available()
    {
        using var client = _factory.CreateClient();

        var reserved = await client.GetFromJsonAsync<ApiResponse<SubdomainAvailabilityDto>>(
            "/api/v1/tenants/check-subdomain?name=admin");
        var invalid = await client.GetFromJsonAsync<ApiResponse<SubdomainAvailabilityDto>>(
            "/api/v1/tenants/check-subdomain?name=-bad-");
        var available = await client.GetFromJsonAsync<ApiResponse<SubdomainAvailabilityDto>>(
            "/api/v1/tenants/check-subdomain?name=fresh-teacher");

        Assert.False(reserved!.Data!.Available);
        Assert.False(invalid!.Data!.Available);
        Assert.True(available!.Data!.Available);
    }
}
