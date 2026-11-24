using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Tenants;

namespace TeacherAssistant.IntegrationTests;

public class LandingPageTests : IAsyncLifetime
{
    private readonly ApiFactory _factory = new();

    public Task InitializeAsync() => _factory.InitializeDatabaseAsync();

    public async Task DisposeAsync() => await _factory.DisposeAsync();

    [Fact]
    public async Task Public_GET_landing_page_returns_default_config_for_new_tenant()
    {
        using var client = _factory.CreateClient();
        await ApiTestHelpers.RegisterTeacherAsync(client, "landing-a", "teacher-a@example.com", "أكاديمية المستقبل");

        var response = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/tenants/current/landing", "landing-a"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        Assert.NotNull(body?.Data);
        Assert.True(body!.Success);
        Assert.Equal(1, body.Data!.Version);
        Assert.NotEmpty(body.Data.Sections);
        Assert.Contains(body.Data.Sections, s => s.Type == "hero");
        Assert.Contains(body.Data.Sections, s => s.Type == "subjects");
    }

    [Fact]
    public async Task Instructor_can_update_own_tenant_landing_page_and_persists()
    {
        using var client = _factory.CreateClient();
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(client, "landing-b", "teacher-b@example.com");

        // Fetch default landing page
        var getResponse = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/tenants/current/landing", "landing-b"));
        var getBody = await getResponse.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        var landingDto = getBody!.Data!;

        // Modify theme and hero content
        landingDto.Theme.PrimaryColor = "#2563EB";
        landingDto.Theme.FontFamily = "Tajawal";
        var heroSection = landingDto.Sections.First(s => s.Type == "hero");
        heroSection.Variant = "centered";
        if (heroSection.Content is JsonObject heroObj)
        {
            heroObj["title"] = "العنوان المخصص الجديد";
        }

        var updateResponse = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, "/api/v1/tenants/current/landing", "landing-b", teacher.Token, landingDto));

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updateBody = await updateResponse.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        Assert.Equal("#2563EB", updateBody!.Data!.Theme.PrimaryColor);

        // Fetch again publicly to verify persistence
        var fetchAgain = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/tenants/current/landing", "landing-b"));
        var fetchAgainBody = await fetchAgain.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        Assert.Equal("#2563EB", fetchAgainBody!.Data!.Theme.PrimaryColor);
        Assert.Equal("Tajawal", fetchAgainBody.Data.Theme.FontFamily);
        Assert.Equal("centered", fetchAgainBody.Data.Sections.First(s => s.Type == "hero").Variant);
    }

    [Fact]
    public async Task Student_cannot_update_landing_page_gets_403()
    {
        using var client = _factory.CreateClient();
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(client, "landing-c", "teacher-c@example.com");
        var (_, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(client, "landing-c", teacher.Token);

        await ApiTestHelpers.RegisterStudentAsync(client, "landing-c", "student-c@example.com", joinCode);
        var studentLogin = await ApiTestHelpers.LoginAsync(client, "landing-c", "student-c@example.com");
        var studentToken = (await studentLogin.Content.ReadFromJsonAsync<ApiResponse<TeacherAssistant.Application.DTOs.Auth.AuthResponseDto>>())!.Data!.Token;

        var defaultDto = LandingPageRules.CreateDefault("Teacher", "Bio", "#0F766E", null);

        var putResponse = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, "/api/v1/tenants/current/landing", "landing-c", studentToken, defaultDto));

        Assert.Equal(HttpStatusCode.Forbidden, putResponse.StatusCode);
    }

    [Fact]
    public async Task Other_tenant_teacher_gets_403_on_update_landing_page()
    {
        using var client = _factory.CreateClient();
        var teacherA = await ApiTestHelpers.RegisterTeacherAsync(client, "landing-d1", "teacher-d1@example.com");
        await ApiTestHelpers.RegisterTeacherAsync(client, "landing-d2", "teacher-d2@example.com");

        var defaultDto = LandingPageRules.CreateDefault("Teacher", "Bio", "#0F766E", null);

        // Teacher A tries to update Tenant D2
        var crossTenantPut = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, "/api/v1/tenants/current/landing", "landing-d2", teacherA.Token, defaultDto));

        Assert.Equal(HttpStatusCode.Forbidden, crossTenantPut.StatusCode);
    }

    [Fact]
    public async Task Invalid_color_is_rejected_with_400_validation_error()
    {
        using var client = _factory.CreateClient();
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(client, "landing-e", "teacher-e@example.com");

        var invalidDto = LandingPageRules.CreateDefault("Teacher", "Bio", "#0F766E", null);
        invalidDto.Theme.PrimaryColor = "invalid-color"; // Not a hex code

        var response = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, "/api/v1/tenants/current/landing", "landing-e", teacher.Token, invalidDto));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        Assert.False(body!.Success);
        Assert.NotEmpty(body.Errors ?? new List<string>());
    }

    [Fact]
    public async Task Invalid_section_variant_is_rejected_with_400_validation_error()
    {
        using var client = _factory.CreateClient();
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(client, "landing-f", "teacher-f@example.com");

        var invalidDto = LandingPageRules.CreateDefault("Teacher", "Bio", "#0F766E", null);
        var hero = invalidDto.Sections.First(s => s.Type == "hero");
        hero.Variant = "non-existent-variant";

        var response = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, "/api/v1/tenants/current/landing", "landing-f", teacher.Token, invalidDto));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        Assert.False(body!.Success);
        Assert.NotEmpty(body.Errors ?? new List<string>());
    }

    [Fact]
    public async Task Reset_landing_page_restores_default_config()
    {
        using var client = _factory.CreateClient();
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(client, "landing-g", "teacher-g@example.com");

        // 1. Modify
        var customDto = LandingPageRules.CreateDefault("Teacher", "Bio", "#10B981", null);
        customDto.Theme.PrimaryColor = "#10B981";
        await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, "/api/v1/tenants/current/landing", "landing-g", teacher.Token, customDto));

        // 2. Reset
        var resetResponse = await client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/tenants/current/landing/reset", "landing-g", teacher.Token));

        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);
        var resetBody = await resetResponse.Content.ReadFromJsonAsync<ApiResponse<LandingPageDto>>();
        Assert.True(resetBody!.Success);
        Assert.NotNull(resetBody.Data);
        Assert.NotEmpty(resetBody.Data!.Sections);
    }
}
