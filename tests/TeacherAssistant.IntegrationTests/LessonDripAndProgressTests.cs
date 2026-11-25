using System.Net;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

public class LessonDripAndProgressTests : IAsyncLifetime
{
    private const string Tenant = "academy";
    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;
    private AuthResponseDto _student = null!;
    private Guid _subjectId;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@example.com", "Academy");

        var (subjectId, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _teacher.Token, "Chemistry", "Saturday Group");
        _subjectId = subjectId;

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

    [Fact]
    public async Task Scheduled_and_sequential_lessons_lock_until_ready_and_previous_lesson_completed()
    {
        // Lesson 1: immediate & open + module + attachment
        var l1Res = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/lessons", Tenant, _teacher.Token,
            new CreateLessonDto
            {
                Title = "المحاضرة الأولى",
                Description = "مقدمة الباب الأول",
                ContentType = ContentType.Video,
                ContentUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                IsPublished = true,
                ModuleTitle = "الشهر الأول: الباب الأول",
                AttachmentUrl = "https://example.com/notes1.pdf"
            }));
        Assert.Equal(HttpStatusCode.Created, l1Res.StatusCode);
        var l1 = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(l1Res)).Data!;
        Assert.Equal("الشهر الأول: الباب الأول", l1.ModuleTitle);
        Assert.Equal("https://example.com/notes1.pdf", l1.AttachmentUrl);

        // Lesson 2: requires previous lesson completion
        var l2Res = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/lessons", Tenant, _teacher.Token,
            new CreateLessonDto
            {
                Title = "المحاضرة الثانية",
                ContentType = ContentType.Video,
                ContentUrl = "https://www.youtube.com/watch?v=9bZkp7q19f0",
                IsPublished = true,
                ModuleTitle = "الشهر الأول: الباب الأول",
                RequiresPreviousCompletion = true
            }));
        Assert.Equal(HttpStatusCode.Created, l2Res.StatusCode);
        var l2 = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(l2Res)).Data!;

        // Lesson 3: scheduled in the future
        var futureTime = DateTime.UtcNow.AddDays(3);
        var l3Res = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/lessons", Tenant, _teacher.Token,
            new CreateLessonDto
            {
                Title = "المحاضرة الثالثة (مجدولة)",
                ContentType = ContentType.Video,
                ContentUrl = "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
                IsPublished = true,
                ModuleTitle = "الشهر الأول: الباب الأول",
                AvailableAt = futureTime
            }));
        Assert.Equal(HttpStatusCode.Created, l3Res.StatusCode);
        var l3 = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(l3Res)).Data!;

        // Instructor can view even scheduled/locked lessons
        var teacherViewL3 = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{l3.Id}", Tenant, _teacher.Token));
        Assert.Equal(HttpStatusCode.OK, teacherViewL3.StatusCode);

        // Student fetches subject detail -> L1 unlocked, L2 locked (prerequisite), L3 locked (scheduled)
        var detailRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, detailRes.StatusCode);
        var detail = (await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(detailRes)).Data!;
        Assert.Equal(3, detail.Lessons.Count);
        Assert.False(detail.Lessons[0].IsLocked);
        Assert.True(detail.Lessons[1].IsLocked);
        Assert.True(detail.Lessons[2].IsLocked);
        Assert.Equal("scheduled", detail.Lessons[2].LockReason);

        // Student blocked from L2 and L3 directly
        var blockedL2 = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{l2.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.Forbidden, blockedL2.StatusCode);

        var blockedL3 = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{l3.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.Forbidden, blockedL3.StatusCode);

        // Student views L1 -> ViewCount increments, then marks L1 complete -> L2 unlocks!
        var viewL1 = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{l1.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, viewL1.StatusCode);
        var viewedL1 = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(viewL1)).Data!;
        Assert.Equal(1, viewedL1.ViewCount);
        Assert.False(viewedL1.IsCompleted);

        var completeL1 = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/lessons/{l1.Id}/complete", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, completeL1.StatusCode);
        var completedL1 = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(completeL1)).Data!;
        Assert.True(completedL1.IsCompleted);

        // Now L2 is unlocked and accessible for student!
        var viewL2 = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{l2.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, viewL2.StatusCode);
        var viewedL2 = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(viewL2)).Data!;
        Assert.Equal(1, viewedL2.ViewCount);

        // Re-check subject detail: L1 IsCompleted=true, L2 IsLocked=false, L3 still scheduled/locked
        var detailAfter = (await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(
            await _client.SendAsync(ApiTestHelpers.CreateRequest(
                HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", Tenant, _student.Token)))).Data!;
        Assert.True(detailAfter.Lessons[0].IsCompleted);
        Assert.False(detailAfter.Lessons[1].IsLocked);
        Assert.True(detailAfter.Lessons[2].IsLocked);
    }
}
