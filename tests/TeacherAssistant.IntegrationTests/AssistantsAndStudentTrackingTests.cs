using System.Net;
using TeacherAssistant.Application.DTOs.Assistants;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Students;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

public class AssistantsAndStudentTrackingTests : IAsyncLifetime
{
    private const string Tenant = "academy";
    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;
    private AuthResponseDto _student = null!;
    private Guid _groupId;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com", "Academy");

        var (_, groupId, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _teacher.Token, "Physics", "Sunday 4pm");
        _groupId = groupId;

        var studentRes = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "ali@example.com", joinCode,
            phoneNumber: "01099887766", parentPhoneNumber: "01299887766",
            dateOfBirth: new DateOnly(2007, 9, 10), gender: Gender.Male);
        Assert.Equal(HttpStatusCode.OK, studentRes.StatusCode);
        _student = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(studentRes)).Data!;
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Instructor_can_manage_multiple_assistants_and_permissions()
    {
        var createFirst = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/assistants", Tenant, _teacher.Token,
            new CreateAssistantDto
            {
                Name = "Assistant Sara",
                Email = "sara@academy.local",
                Password = ApiTestHelpers.DefaultPassword,
                PhoneNumber = "01055551111",
                Permissions = AssistantPermissions.ViewStudentProgress
            }));
        Assert.Equal(HttpStatusCode.Created, createFirst.StatusCode);

        var createSecond = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/assistants", Tenant, _teacher.Token,
            new CreateAssistantDto
            {
                Name = "Assistant Omar",
                Email = "omar@academy.local",
                Password = ApiTestHelpers.DefaultPassword,
                Permissions = AssistantPermissions.ViewStudentProgress | AssistantPermissions.ManageGroups
            }));
        Assert.Equal(HttpStatusCode.Created, createSecond.StatusCode);

        var secondDto = (await ApiTestHelpers.ReadApiResponseAsync<AssistantDto>(createSecond)).Data!;

        var listRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/assistants", Tenant, _teacher.Token));
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var list = (await ApiTestHelpers.ReadApiResponseAsync<List<AssistantDto>>(listRes)).Data!;
        Assert.Equal(2, list.Count);

        var updateRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Put, $"/api/v1/assistants/{secondDto.Id}/permissions", Tenant, _teacher.Token,
            new UpdateAssistantPermissionsDto { Permissions = AssistantPermissions.ManageContent }));
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);
        var updated = (await ApiTestHelpers.ReadApiResponseAsync<AssistantDto>(updateRes)).Data!;
        Assert.Equal(AssistantPermissions.ManageContent, updated.Permissions);

        var deleteRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Delete, $"/api/v1/assistants/{secondDto.Id}", Tenant, _teacher.Token));
        Assert.Equal(HttpStatusCode.OK, deleteRes.StatusCode);
    }

    [Fact]
    public async Task Assistant_login_on_platform_enforces_granular_permissions()
    {
        await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/assistants", Tenant, _teacher.Token,
            new CreateAssistantDto
            {
                Name = "Tracker Assistant",
                Email = "tracker@academy.local",
                Password = ApiTestHelpers.DefaultPassword,
                Permissions = AssistantPermissions.ViewStudentProgress
            }));

        await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/assistants", Tenant, _teacher.Token,
            new CreateAssistantDto
            {
                Name = "Content Only Assistant",
                Email = "content@academy.local",
                Password = ApiTestHelpers.DefaultPassword,
                Permissions = AssistantPermissions.ManageContent
            }));

        // Assistant logs in from the platform domain (tenant == null) just like a teacher.
        var trackerLoginRes = await ApiTestHelpers.LoginAsync(_client, null, "tracker@academy.local");
        Assert.Equal(HttpStatusCode.OK, trackerLoginRes.StatusCode);
        var trackerAuth = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(trackerLoginRes)).Data!;
        Assert.Equal(UserRole.Assistant, trackerAuth.Role);
        Assert.Equal(Tenant, trackerAuth.TenantSubdomain);
        Assert.Equal(AssistantPermissions.ViewStudentProgress, trackerAuth.Permissions);

        var contentLoginRes = await ApiTestHelpers.LoginAsync(_client, null, "content@academy.local");
        Assert.Equal(HttpStatusCode.OK, contentLoginRes.StatusCode);
        var contentAuth = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(contentLoginRes)).Data!;

        // Tracker assistant CAN view students list, group students, and student 360 progress.
        var studentsRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/students", Tenant, trackerAuth.Token));
        Assert.Equal(HttpStatusCode.OK, studentsRes.StatusCode);
        var students = (await ApiTestHelpers.ReadApiResponseAsync<List<StudentSummaryDto>>(studentsRes)).Data!;
        var ali = Assert.Single(students, s => s.Email == "ali@example.com");
        Assert.Equal("01099887766", ali.PhoneNumber);
        Assert.Equal("01299887766", ali.ParentPhoneNumber);
        Assert.Equal(Gender.Male, ali.Gender);

        var progressRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/students/{_student.UserId}/progress", Tenant, trackerAuth.Token));
        Assert.Equal(HttpStatusCode.OK, progressRes.StatusCode);
        var progress = (await ApiTestHelpers.ReadApiResponseAsync<StudentProgressDto>(progressRes)).Data!;
        Assert.Single(progress.Groups);
        Assert.Equal("Sunday 4pm", progress.Groups[0].GroupName);

        var groupStudentsRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/groups/{_groupId}/students", Tenant, trackerAuth.Token));
        Assert.Equal(HttpStatusCode.OK, groupStudentsRes.StatusCode);

        // Content-only assistant CANNOT view student tracking (403 Forbidden).
        var forbiddenStudents = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/students", Tenant, contentAuth.Token));
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenStudents.StatusCode);

        // No assistant can manage other assistants (InstructorOnly -> 403 Forbidden).
        var forbiddenAssistants = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/assistants", Tenant, trackerAuth.Token));
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenAssistants.StatusCode);
    }
}
