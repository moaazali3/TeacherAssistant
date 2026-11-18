using System.Net;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

/// <summary>
/// Exercises the 429 paths with the production-shaped limits (or a smaller limit where
/// that keeps the test short). Limits are configurable through ApiFactory.
/// </summary>
public class RateLimitingTests : IAsyncLifetime
{
    private const string Tenant = "limited";

    private readonly ApiFactory _factory = new(new Dictionary<string, string?>
    {
        ["RateLimiting:Enabled"] = "true",
        ["RateLimiting:Login:PermitLimit"] = "5",
        ["RateLimiting:Login:WindowMinutes"] = "1",
        ["RateLimiting:JoinCode:PermitLimit"] = "10",
        ["RateLimiting:JoinCode:WindowMinutes"] = "10"
    });

    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        return _factory.DisposeAsync().AsTask();
    }

    [Fact]
    public async Task Sixth_login_attempt_returns_429_with_an_arabic_message()
    {
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com");

        // The policy allows five attempts per IP + email; the first five are rejected
        // by the normal credential check, the sixth is rejected by the limiter.
        for (var attempt = 1; attempt <= 5; attempt++)
        {
            var response = await ApiTestHelpers.LoginAsync(
                _client, Tenant, "teacher@example.com", "WrongPass@123");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        var limited = await ApiTestHelpers.LoginAsync(
            _client, Tenant, "teacher@example.com", "WrongPass@123");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<string>(limited);
        Assert.False(body.Success);
        Assert.Contains("محاولات تسجيل الدخول", body.Message);

        // The correct password is also blocked until the window resets.
        var withCorrectPassword = await ApiTestHelpers.LoginAsync(
            _client, Tenant, "teacher@example.com", ApiTestHelpers.DefaultPassword);
        Assert.Equal(HttpStatusCode.TooManyRequests, withCorrectPassword.StatusCode);

        // A different email is a different partition and still works.
        var otherEmail = await ApiTestHelpers.LoginAsync(
            _client, Tenant, "someone-else@example.com", ApiTestHelpers.DefaultPassword);
        Assert.Equal(HttpStatusCode.Unauthorized, otherEmail.StatusCode);

        Assert.NotNull(teacher.Token);
    }

    [Fact]
    public async Task Limits_are_read_from_configuration()
    {
        using var factory = new ApiFactory(new Dictionary<string, string?>
        {
            ["RateLimiting:Login:PermitLimit"] = "1",
            ["RateLimiting:Login:WindowMinutes"] = "1"
        });

        await factory.InitializeDatabaseAsync();
        using var client = factory.CreateClient();
        await ApiTestHelpers.RegisterTeacherAsync(client, "configured", "configured@example.com");

        var first = await ApiTestHelpers.LoginAsync(
            client, "configured", "configured@example.com", "WrongPass@123");
        Assert.Equal(HttpStatusCode.Unauthorized, first.StatusCode);

        var second = await ApiTestHelpers.LoginAsync(
            client, "configured", "configured@example.com", "WrongPass@123");
        Assert.Equal(HttpStatusCode.TooManyRequests, second.StatusCode);
    }

    [Fact]
    public async Task Repeated_wrong_join_codes_on_register_student_return_429()
    {
        var teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com");
        await ApiTestHelpers.CreateSubjectWithGroupAsync(_client, Tenant, teacher.Token);

        for (var attempt = 1; attempt <= 10; attempt++)
        {
            var response = await ApiTestHelpers.RegisterStudentAsync(
                _client, Tenant, $"student{attempt}@example.com", "WRONG123");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var limited = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "student-final@example.com", "WRONG123");

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(limited);
        Assert.False(body.Success);
        Assert.Contains("كود الانضمام", body.Message);
    }

    [Fact]
    public async Task Repeated_wrong_join_codes_on_groups_join_return_429()
    {
        await ApiTestHelpers.RegisterTeacherAsync(_client, Tenant, "teacher@example.com");

        var student = await ApiTestHelpers.CreateUserDirectlyAndLoginAsync(
            _factory, _client, Tenant, "student@example.com", UserRole.Student);

        for (var attempt = 1; attempt <= 10; attempt++)
        {
            var response = await _client.SendAsync(ApiTestHelpers.CreateRequest(
                HttpMethod.Post,
                "/api/v1/groups/join",
                Tenant,
                student.Token,
                new JoinGroupDto { Code = "WRONG123" }));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var limited = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post,
            "/api/v1/groups/join",
            Tenant,
            student.Token,
            new JoinGroupDto { Code = "WRONG123" }));

        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<MyGroupDto>(limited);
        Assert.False(body.Success);
        Assert.Contains("كود الانضمام", body.Message);
    }
}
