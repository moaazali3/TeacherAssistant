using System.Net;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Application.DTOs.Subjects;

namespace TeacherAssistant.IntegrationTests;

public class SubjectGradeLevelTests : IAsyncLifetime
{
    private const string Tenant = "physics-grade";
    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;
    private AuthResponseDto _student = null!;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@physics-grade.example", "Physics Academy");
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Same_grade_available_returns_only_unenrolled_subjects_matching_student_grade()
    {
        const string grade3 = "الصف الثالث الثانوي";
        const string grade1 = "الصف الأول الثانوي";

        // 1. Create Physics 3rd Secondary + Group
        var s1Res = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/subjects", Tenant, _teacher.Token,
            new CreateSubjectDto
            {
                Title = "فيزياء 3 ثانوي",
                Description = "المنهج الكامل",
                GradeLevel = grade3,
                IsPublished = true
            }));
        Assert.Equal(HttpStatusCode.Created, s1Res.StatusCode);
        var subject3 = (await ApiTestHelpers.ReadApiResponseAsync<SubjectSummaryDto>(s1Res)).Data!;

        var groupRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{subject3.Id}/groups", Tenant, _teacher.Token,
            new CreateGroupDto { Name = "مجموعة السبت" }));
        Assert.Equal(HttpStatusCode.Created, groupRes.StatusCode);
        var joinCode = (await ApiTestHelpers.ReadApiResponseAsync<GroupDto>(groupRes)).Data!.JoinCode;

        // 2. Create Final Review 3rd Secondary (same grade, unenrolled)
        var s2Res = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/subjects", Tenant, _teacher.Token,
            new CreateSubjectDto
            {
                Title = "مراجعة نهائية فيزياء",
                Description = "مراجعة ليلة الامتحان",
                GradeLevel = grade3,
                IsPublished = true
            }));
        Assert.Equal(HttpStatusCode.Created, s2Res.StatusCode);

        // 3. Create Physics 1st Secondary (different grade, must NOT appear for 3rd secondary student)
        var s3Res = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, "/api/v1/subjects", Tenant, _teacher.Token,
            new CreateSubjectDto
            {
                Title = "فيزياء 1 ثانوي",
                Description = "مقدمة الفيزياء",
                GradeLevel = grade1,
                IsPublished = true
            }));
        Assert.Equal(HttpStatusCode.Created, s3Res.StatusCode);

        // 4. Register student into 3rd Secondary group
        var studentRes = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "student3@physics.example", joinCode);
        Assert.Equal(HttpStatusCode.OK, studentRes.StatusCode);
        _student = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(studentRes)).Data!;

        // 5. GET /api/v1/subjects/same-grade-available returns ONLY "مراجعة نهائية فيزياء"
        var availRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/subjects/same-grade-available", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, availRes.StatusCode);
        var available = (await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(availRes)).Data!;

        var only = Assert.Single(available);
        Assert.Equal("مراجعة نهائية فيزياء", only.Title);
        Assert.Equal(grade3, only.GradeLevel);

        // 6. GET /api/v1/groups/mine includes SubjectGradeLevel
        var myGroupsRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, "/api/v1/groups/mine", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, myGroupsRes.StatusCode);
        var myGroups = (await ApiTestHelpers.ReadApiResponseAsync<List<MyGroupDto>>(myGroupsRes)).Data!;
        var myGroup = Assert.Single(myGroups);
        Assert.Equal(grade3, myGroup.SubjectGradeLevel);
    }
}
