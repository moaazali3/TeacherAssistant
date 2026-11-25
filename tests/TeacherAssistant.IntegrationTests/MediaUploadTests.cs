using System.Net;
using System.Net.Http.Headers;
using TeacherAssistant.API.Controllers;
using TeacherAssistant.Application.DTOs.Auth;

namespace TeacherAssistant.IntegrationTests;

public class MediaUploadTests : IAsyncLifetime
{
    private const string Tenant = "academy";
    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;
    private AuthResponseDto _student = null!;
    private readonly List<string> _uploadedRelativeUrls = new();

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com", "Academy");

        var (_, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _teacher.Token, "Physics", "Saturday 4pm");

        var studentRes = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "student@example.com", joinCode);
        Assert.Equal(HttpStatusCode.OK, studentRes.StatusCode);
        _student = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(studentRes)).Data!;
    }

    public async Task DisposeAsync()
    {
        var apiRoot = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "TeacherAssistant.Api"));

        foreach (var url in _uploadedRelativeUrls)
        {
            var rel = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var candidate = Path.Combine(apiRoot, rel);
            if (File.Exists(candidate))
            {
                File.Delete(candidate);
            }
        }

        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Instructor_can_upload_image_to_storage_and_retrieve_it_via_static_route()
    {
        var sampleBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(sampleBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "cover.png");
        form.Add(new StringContent("subjects"), "folder");

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/media/upload-image")
        {
            Content = form
        };
        request.Headers.Add("X-Tenant", Tenant);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _teacher.Token);

        var res = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<UploadedImageDto>(res);
        Assert.True(body.Success);
        Assert.StartsWith($"/storage/{Tenant}/subjects/", body.Data!.Url);
        _uploadedRelativeUrls.Add(body.Data.Url);

        // Uploaded image is immediately served via /storage static route
        var fetchRes = await _client.GetAsync(body.Data.Url);
        Assert.Equal(HttpStatusCode.OK, fetchRes.StatusCode);
        var downloaded = await fetchRes.Content.ReadAsByteArrayAsync();
        Assert.Equal(sampleBytes, downloaded);
    }

    [Fact]
    public async Task Non_image_files_are_rejected_and_students_are_forbidden()
    {
        using var badForm = new MultipartFormDataContent();
        var textContent = new ByteArrayContent("hello"u8.ToArray());
        textContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        badForm.Add(textContent, "file", "notes.txt");

        var badReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/media/upload-image")
        {
            Content = badForm
        };
        badReq.Headers.Add("X-Tenant", Tenant);
        badReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _teacher.Token);

        var badRes = await _client.SendAsync(badReq);
        Assert.Equal(HttpStatusCode.BadRequest, badRes.StatusCode);

        using var studentForm = new MultipartFormDataContent();
        var pngContent = new ByteArrayContent(new byte[] { 0x89, 0x50, 0x4E, 0x47 });
        pngContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        studentForm.Add(pngContent, "file", "avatar.png");

        var studentReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/media/upload-image")
        {
            Content = studentForm
        };
        studentReq.Headers.Add("X-Tenant", Tenant);
        studentReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _student.Token);

        var studentRes = await _client.SendAsync(studentReq);
        Assert.Equal(HttpStatusCode.Forbidden, studentRes.StatusCode);
    }
}
