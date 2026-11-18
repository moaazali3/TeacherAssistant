using System.Net;
using System.Net.Http.Json;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Students;

namespace TeacherAssistant.IntegrationTests;

public class PasswordPolicyTests : IAsyncLifetime
{
    private const string Tenant = "policy";

    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com");
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        return _factory.DisposeAsync().AsTask();
    }

    [Fact]
    public async Task Teacher_registration_requires_a_letter_and_a_digit()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register-teacher",
            new RegisterTeacherRequestDto
            {
                Name = "No Digit",
                Email = "nodigit@example.com",
                Password = "PasswordOnly",
                Subdomain = "no-digit",
                TenantName = "No Digit Academy"
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(response);
        Assert.False(body.Success);
        Assert.Contains(body.Errors!, error => error.Contains("letter and one digit"));
    }

    [Fact]
    public async Task Student_registration_requires_a_letter_and_a_digit()
    {
        var response = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "student@example.com", "WRONG123", password: "12345678");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(response);
        Assert.False(body.Success);
        Assert.Contains(body.Errors!, error => error.Contains("letter and one digit"));
    }

    [Fact]
    public async Task Password_reset_requires_a_letter_and_a_digit()
    {
        // Model validation runs before the student lookup, so any id demonstrates the rule.
        var response = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post,
            $"/api/v1/students/{_teacher.UserId}/reset-password",
            Tenant,
            _teacher.Token,
            new ResetStudentPasswordDto { NewPassword = "passwordonly" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<string>(response);
        Assert.False(body.Success);
        Assert.Contains(body.Errors!, error => error.Contains("letter and one digit"));
    }
}
