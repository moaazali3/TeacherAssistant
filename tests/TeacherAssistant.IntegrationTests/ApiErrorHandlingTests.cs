using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using TeacherAssistant.API.Middlewares;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Subjects;

namespace TeacherAssistant.IntegrationTests;

/// <summary>
/// Cross-endpoint contract tests verifying consistent JSON ApiResponse error handling
/// for 400, 401, 403, 404, and 413 scenarios without leaking HTML fallbacks or 500s.
/// </summary>
public class ApiErrorHandlingTests : IAsyncLifetime
{
    private const string Tenant = "academy";
    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;
    private AuthResponseDto _student = null!;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com", "Academy");

        var (_, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _teacher.Token, "Chemistry", "Saturday Group");

        var studentRes = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "student@example.com", joinCode);
        Assert.Equal(HttpStatusCode.OK, studentRes.StatusCode);
        _student = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(studentRes)).Data!;
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    private static async Task<ApiResponse<object>> AssertFailureJsonAsync(
        HttpResponseMessage response,
        HttpStatusCode expectedStatus)
    {
        Assert.Equal(expectedStatus, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

        var body = await ApiTestHelpers.ReadApiResponseAsync<object>(response);
        Assert.False(body.Success);
        Assert.False(string.IsNullOrWhiteSpace(body.Message));
        return body;
    }

    [Fact]
    public async Task Unknown_api_route_returns_404_json_instead_of_spa_html_fallback()
    {
        var req = ApiTestHelpers.CreateRequest(HttpMethod.Get, "/api/v1/does-not-exist", Tenant);
        var res = await _client.SendAsync(req);

        await AssertFailureJsonAsync(res, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Invalid_guid_route_parameter_returns_404_json_instead_of_spa_html_fallback()
    {
        var req = ApiTestHelpers.CreateRequest(HttpMethod.Get, "/api/v1/subjects/not-a-guid", Tenant, _teacher.Token);
        var res = await _client.SendAsync(req);

        await AssertFailureJsonAsync(res, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Malformed_json_payload_returns_400_json()
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = new StringContent("{bad json", Encoding.UTF8, "application/json")
        };
        req.Headers.Add("X-Tenant", Tenant);

        var res = await _client.SendAsync(req);
        await AssertFailureJsonAsync(res, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Empty_register_teacher_payload_returns_400_validation_errors_json()
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register-teacher")
        {
            Content = new StringContent("{}", Encoding.UTF8, "application/json")
        };

        var res = await _client.SendAsync(req);
        var body = await AssertFailureJsonAsync(res, HttpStatusCode.BadRequest);
        Assert.NotNull(body.Errors);
        Assert.NotEmpty(body.Errors!);
    }

    [Fact]
    public async Task Unauthenticated_request_to_protected_endpoint_returns_401_json()
    {
        var req = ApiTestHelpers.CreateRequest(HttpMethod.Get, "/api/v1/subjects/mine", Tenant);
        var res = await _client.SendAsync(req);

        await AssertFailureJsonAsync(res, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Student_calling_instructor_endpoints_returns_403_json()
    {
        var mineReq = ApiTestHelpers.CreateRequest(HttpMethod.Get, "/api/v1/subjects/mine", Tenant, _student.Token);
        var mineRes = await _client.SendAsync(mineReq);
        await AssertFailureJsonAsync(mineRes, HttpStatusCode.Forbidden);

        var createReq = ApiTestHelpers.CreateRequest(
            HttpMethod.Post,
            "/api/v1/subjects",
            Tenant,
            _student.Token,
            new CreateSubjectDto { Title = "Unauthorized Subject", Description = "Nope" });
        var createRes = await _client.SendAsync(createReq);
        await AssertFailureJsonAsync(createRes, HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Unknown_tenant_header_on_api_endpoint_returns_404_json()
    {
        var req = ApiTestHelpers.CreateRequest(HttpMethod.Get, "/api/v1/subjects", "nonexistent-xyz");
        var res = await _client.SendAsync(req);

        await AssertFailureJsonAsync(res, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Nonexistent_resource_guids_return_404_json()
    {
        var missingId = Guid.NewGuid();

        foreach (var path in new[]
        {
            $"/api/v1/subjects/{missingId}",
            $"/api/v1/lessons/{missingId}",
            $"/api/v1/quizzes/{missingId}"
        })
        {
            var req = ApiTestHelpers.CreateRequest(HttpMethod.Get, path, Tenant, _teacher.Token);
            var res = await _client.SendAsync(req);
            await AssertFailureJsonAsync(res, HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task Invalid_login_credentials_return_401_json()
    {
        var res = await ApiTestHelpers.LoginAsync(_client, Tenant, "teacher@example.com", "Wrong@Pass123!");
        await AssertFailureJsonAsync(res, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Oversized_image_upload_returns_400_json_for_file_over_5mb()
    {
        var oversizedBytes = new byte[7 * 1024 * 1024]; // exceeds MediaController's 5 MB MaxImageBytes (TestServer skips [RequestSizeLimit])
        oversizedBytes[0] = 0x89;
        oversizedBytes[1] = 0x50;
        oversizedBytes[2] = 0x4E;
        oversizedBytes[3] = 0x47;

        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(oversizedBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "huge.png");

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/media/upload-image")
        {
            Content = form
        };
        req.Headers.Add("X-Tenant", Tenant);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _teacher.Token);

        var res = await _client.SendAsync(req);
        await AssertFailureJsonAsync(res, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Global_exception_middleware_maps_413_and_redacts_500_details_in_production()
    {
        var prodEnv = new StubHostEnvironment { EnvironmentName = Environments.Production };

        // 1. BadHttpRequestException with 413 PayloadTooLarge
        var mw413 = new GlobalExceptionHandlingMiddleware(
            _ => throw new BadHttpRequestException("Request body too large.", StatusCodes.Status413PayloadTooLarge),
            NullLogger<GlobalExceptionHandlingMiddleware>.Instance,
            prodEnv);

        var ctx413 = new DefaultHttpContext();
        ctx413.Response.Body = new MemoryStream();
        await mw413.InvokeAsync(ctx413);

        Assert.Equal(StatusCodes.Status413PayloadTooLarge, ctx413.Response.StatusCode);
        Assert.Equal("application/json", ctx413.Response.ContentType);
        ctx413.Response.Body.Position = 0;
        var body413 = await JsonSerializer.DeserializeAsync<ApiResponse<string>>(
            ctx413.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(body413);
        Assert.False(body413!.Success);

        // 2. Unhandled exception in Production redacts internal exception message
        var mw500 = new GlobalExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("secret-db-connection-string"),
            NullLogger<GlobalExceptionHandlingMiddleware>.Instance,
            prodEnv);

        var ctx500 = new DefaultHttpContext();
        ctx500.Response.Body = new MemoryStream();
        await mw500.InvokeAsync(ctx500);

        Assert.Equal(StatusCodes.Status500InternalServerError, ctx500.Response.StatusCode);
        Assert.Equal("application/json", ctx500.Response.ContentType);
        ctx500.Response.Body.Position = 0;
        var raw500 = await new StreamReader(ctx500.Response.Body).ReadToEndAsync();
        Assert.DoesNotContain("secret-db-connection-string", raw500);
        var body500 = JsonSerializer.Deserialize<ApiResponse<string>>(
            raw500,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(body500);
        Assert.False(body500!.Success);

        // 3. OperationCanceledException when client aborted returns 499 cleanly
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var mw499 = new GlobalExceptionHandlingMiddleware(
            ctx => throw new OperationCanceledException(ctx.RequestAborted),
            NullLogger<GlobalExceptionHandlingMiddleware>.Instance,
            prodEnv);

        var ctx499 = new DefaultHttpContext { RequestAborted = cts.Token };
        await mw499.InvokeAsync(ctx499);
        Assert.Equal(499, ctx499.Response.StatusCode);
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "TeacherAssistant.API";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
