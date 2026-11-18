using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Domain.Enums;
using TeacherAssistant.Infrastructure.Persistence;

namespace TeacherAssistant.IntegrationTests;

/// <summary>
/// Subject lifecycle behaviour expressed against /api/v1/subjects.
/// </summary>
public class SubjectsTests : IAsyncLifetime
{
    private const string Tenant = "academy";
    private const string OtherTenant = "rival";

    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;

    private AuthResponseDto _owner = null!;
    private AuthResponseDto _otherTeacher = null!;
    private AuthResponseDto _student = null!;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _owner = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "owner@example.com", "Owner Academy");

        _otherTeacher = await ApiTestHelpers.CreateUserDirectlyAndLoginAsync(
            _factory, _client, Tenant, "second-teacher@example.com", UserRole.Instructor);

        _student = await ApiTestHelpers.CreateUserDirectlyAndLoginAsync(
            _factory, _client, Tenant, "student@example.com", UserRole.Student);
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    // ---------------------------------------------------------------------
    // Owner workflow
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Owner_can_create_a_subject_and_list_it_in_mine()
    {
        var create = await SendAsync(HttpMethod.Post, "/api/v1/subjects", _owner.Token,
            new CreateSubjectDto
            {
                Title = "Algebra Basics",
                Description = "First steps",
                ThumbnailUrl = "https://cdn.example.com/algebra.png"
            });

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await ApiTestHelpers.ReadApiResponseAsync<SubjectSummaryDto>(create);
        Assert.True(created.Success);
        Assert.False(created.Data!.IsPublished);
        Assert.Equal(0, created.Data.LessonsCount);

        var mineResponse = await SendAsync(HttpMethod.Get, "/api/v1/subjects/mine", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, mineResponse.StatusCode);
        var mine = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(mineResponse);
        var only = Assert.Single(mine.Data!);
        Assert.Equal("Algebra Basics", only.Title);

        // Drafts are invisible on the public listing.
        var publicResponse = await SendAsync(HttpMethod.Get, "/api/v1/subjects");
        var publicList = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(publicResponse);
        Assert.Empty(publicList.Data!);
    }

    [Fact]
    public async Task Another_teacher_in_the_same_tenant_gets_403_on_every_mutation()
    {
        var subject = await CreateSubjectAsync(_owner.Token, "Owned subject", isPublished: true);
        var lesson = await AddLessonAsync(_owner.Token, subject.Id, "Lesson 1", isPublished: true);

        var updateSubject = await SendAsync(HttpMethod.Put, $"/api/v1/subjects/{subject.Id}",
            _otherTeacher.Token, new UpdateSubjectDto { Title = "Hijacked" });
        Assert.Equal(HttpStatusCode.Forbidden, updateSubject.StatusCode);

        var deleteSubject = await SendAsync(HttpMethod.Delete, $"/api/v1/subjects/{subject.Id}",
            _otherTeacher.Token);
        Assert.Equal(HttpStatusCode.Forbidden, deleteSubject.StatusCode);

        var addLesson = await SendAsync(HttpMethod.Post, $"/api/v1/subjects/{subject.Id}/lessons",
            _otherTeacher.Token, NewLesson("Intruder lesson"));
        Assert.Equal(HttpStatusCode.Forbidden, addLesson.StatusCode);

        var reorder = await SendAsync(HttpMethod.Put, $"/api/v1/subjects/{subject.Id}/lessons/reorder",
            _otherTeacher.Token, new ReorderLessonsDto { LessonIds = new List<Guid> { lesson.Id } });
        Assert.Equal(HttpStatusCode.Forbidden, reorder.StatusCode);

        var updateLesson = await SendAsync(HttpMethod.Put, $"/api/v1/lessons/{lesson.Id}",
            _otherTeacher.Token, NewLessonUpdate("Changed"));
        Assert.Equal(HttpStatusCode.Forbidden, updateLesson.StatusCode);

        var deleteLesson = await SendAsync(HttpMethod.Delete, $"/api/v1/lessons/{lesson.Id}",
            _otherTeacher.Token);
        Assert.Equal(HttpStatusCode.Forbidden, deleteLesson.StatusCode);

        // Nothing was modified.
        var ownerView = await SendAsync(HttpMethod.Get, "/api/v1/subjects/mine", _owner.Token);
        var mine = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(ownerView);
        Assert.Single(mine.Data!);
        Assert.Equal("Owned subject", mine.Data![0].Title);
    }

    [Fact]
    public async Task Students_are_forbidden_from_instructor_endpoints()
    {
        var create = await SendAsync(HttpMethod.Post, "/api/v1/subjects", _student.Token,
            new CreateSubjectDto { Title = "Student subject" });
        Assert.Equal(HttpStatusCode.Forbidden, create.StatusCode);

        var mine = await SendAsync(HttpMethod.Get, "/api/v1/subjects/mine", _student.Token);
        Assert.Equal(HttpStatusCode.Forbidden, mine.StatusCode);

        var subject = await CreateSubjectAsync(_owner.Token, "Teacher subject");
        var addLesson = await SendAsync(HttpMethod.Post, $"/api/v1/subjects/{subject.Id}/lessons",
            _student.Token, NewLesson("Nope"));
        Assert.Equal(HttpStatusCode.Forbidden, addLesson.StatusCode);
    }

    // ---------------------------------------------------------------------
    // Visibility rules
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Public_listing_contains_only_published_subjects_and_counts_published_lessons()
    {
        var published = await CreateSubjectAsync(_owner.Token, "Published", isPublished: true);
        await AddLessonAsync(_owner.Token, published.Id, "Published lesson", isPublished: true);
        await AddLessonAsync(_owner.Token, published.Id, "Draft lesson", isPublished: false);
        await CreateSubjectAsync(_owner.Token, "Draft subject", isPublished: false);

        var response = await SendAsync(HttpMethod.Get, "/api/v1/subjects");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(response);
        var only = Assert.Single(body.Data!);
        Assert.Equal("Published", only.Title);
        Assert.Equal(1, only.LessonsCount);
    }

    [Fact]
    public async Task Public_detail_hides_drafts_from_non_owners_and_never_exposes_content_url()
    {
        var published = await CreateSubjectAsync(_owner.Token, "Published", isPublished: true);
        await AddLessonAsync(_owner.Token, published.Id, "Visible lesson", isPublished: true);
        await AddLessonAsync(_owner.Token, published.Id, "Hidden lesson", isPublished: false);

        var draft = await CreateSubjectAsync(_owner.Token, "Draft", isPublished: false);
        await AddLessonAsync(_owner.Token, draft.Id, "Draft subject lesson", isPublished: true);

        // Anonymous caller: only published lessons, no ContentUrl anywhere in the payload.
        var anonymous = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{published.Id}");
        Assert.Equal(HttpStatusCode.OK, anonymous.StatusCode);

        var detail = await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(anonymous);
        var visible = Assert.Single(detail.Data!.Lessons);
        Assert.Equal("Visible lesson", visible.Title);

        var rawJson = await anonymous.Content.ReadAsStringAsync();
        Assert.DoesNotContain("contentUrl", rawJson, StringComparison.OrdinalIgnoreCase);

        // Owner sees the draft lesson too.
        var ownerView = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{published.Id}", _owner.Token);
        var ownerDetail = await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(ownerView);
        Assert.Equal(2, ownerDetail.Data!.Lessons.Count);
        Assert.Contains(ownerDetail.Data.Lessons, l => l.Title == "Hidden lesson");

        // Draft subject: hidden from everyone except the owner.
        var anonymousDraft = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{draft.Id}");
        Assert.Equal(HttpStatusCode.NotFound, anonymousDraft.StatusCode);

        var studentDraft = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{draft.Id}", _student.Token);
        Assert.Equal(HttpStatusCode.NotFound, studentDraft.StatusCode);

        var ownerDraft = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{draft.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, ownerDraft.StatusCode);
    }

    [Fact]
    public async Task Subjects_of_another_tenant_are_invisible()
    {
        var subject = await CreateSubjectAsync(_owner.Token, "Tenant A subject", isPublished: true);

        var rivalTeacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, OtherTenant, "rival@example.com", "Rival Academy");

        var rivalList = await SendAsync(
            HttpMethod.Get, "/api/v1/subjects", rivalTeacher.Token, tenant: OtherTenant);
        var rivalListBody = await ApiTestHelpers.ReadApiResponseAsync<List<SubjectSummaryDto>>(rivalList);
        Assert.Empty(rivalListBody.Data!);

        var rivalDetail = await SendAsync(
            HttpMethod.Get, $"/api/v1/subjects/{subject.Id}", rivalTeacher.Token, tenant: OtherTenant);
        Assert.Equal(HttpStatusCode.NotFound, rivalDetail.StatusCode);

        var rivalUpdate = await SendAsync(HttpMethod.Put, $"/api/v1/subjects/{subject.Id}",
            rivalTeacher.Token, new UpdateSubjectDto { Title = "Stolen" }, OtherTenant);
        Assert.Equal(HttpStatusCode.NotFound, rivalUpdate.StatusCode);
    }

    // ---------------------------------------------------------------------
    // Lessons
    // ---------------------------------------------------------------------

    [Fact]
    public async Task Members_receive_the_full_lesson_but_outsiders_and_anonymous_callers_do_not()
    {
        var (subjectId, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, subjectTitle: "Subject");

        var lesson = await AddLessonAsync(
            _owner.Token, subjectId, "Watched lesson", isPublished: true,
            contentUrl: "https://www.youtube.com/watch?v=abc123");

        // A student without a membership sees nothing.
        var beforeJoining = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", _student.Token);
        Assert.Equal(HttpStatusCode.NotFound, beforeJoining.StatusCode);

        var anonymous = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);

        // Joining a group of the subject unlocks its published lessons.
        var joined = await SendAsync(HttpMethod.Post, "/api/v1/groups/join", _student.Token,
            new JoinGroupDto { Code = joinCode });
        Assert.Equal(HttpStatusCode.Created, joined.StatusCode);

        var asStudent = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", _student.Token);
        Assert.Equal(HttpStatusCode.OK, asStudent.StatusCode);

        var studentLesson = await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(asStudent);
        Assert.Equal("https://www.youtube.com/watch?v=abc123", studentLesson.Data!.ContentUrl);

        // Draft lessons stay hidden for members but remain visible to the owner.
        var draftLesson = await AddLessonAsync(_owner.Token, subjectId, "Draft lesson", isPublished: false);

        var studentDraft = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{draftLesson.Id}", _student.Token);
        Assert.Equal(HttpStatusCode.NotFound, studentDraft.StatusCode);

        var ownerDraft = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{draftLesson.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, ownerDraft.StatusCode);
    }

    [Fact]
    public async Task Members_can_read_published_lessons_of_their_subject()
    {
        var (subjectId, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, subjectTitle: "Joined subject");

        var lesson = await AddLessonAsync(_owner.Token, subjectId, "Visible lesson", isPublished: true);

        var joined = await SendAsync(HttpMethod.Post, "/api/v1/groups/join", _student.Token,
            new JoinGroupDto { Code = joinCode });
        Assert.Equal(HttpStatusCode.Created, joined.StatusCode);

        var response = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", _student.Token);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(response);
        Assert.Equal("https://example.com/lesson", body.Data!.ContentUrl);

        // A non-member of the same tenant still gets 404.
        var outsider = await ApiTestHelpers.CreateUserDirectlyAndLoginAsync(
            _factory, _client, Tenant, "outsider@example.com", UserRole.Student);
        var outsiderResponse = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", outsider.Token);
        Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);
    }

    [Fact]
    public async Task Lessons_of_an_unpublished_subject_stay_hidden_from_members()
    {
        var (subjectId, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _owner.Token, subjectTitle: "Draft subject", isPublished: false);

        var lesson = await AddLessonAsync(_owner.Token, subjectId, "Published lesson", isPublished: true);

        var joined = await SendAsync(HttpMethod.Post, "/api/v1/groups/join", _student.Token,
            new JoinGroupDto { Code = joinCode });
        Assert.Equal(HttpStatusCode.Created, joined.StatusCode);

        var asStudent = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", _student.Token);
        Assert.Equal(HttpStatusCode.NotFound, asStudent.StatusCode);

        var asOwner = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, asOwner.StatusCode);
    }

    [Fact]
    public async Task New_lessons_append_and_reorder_rewrites_the_full_sequence()
    {
        var subject = await CreateSubjectAsync(_owner.Token, "Ordered subject", isPublished: true);
        var first = await AddLessonAsync(_owner.Token, subject.Id, "First", isPublished: true);
        var second = await AddLessonAsync(_owner.Token, subject.Id, "Second", isPublished: true);
        var third = await AddLessonAsync(_owner.Token, subject.Id, "Third", isPublished: true);

        Assert.Equal(1, first.SortOrder);
        Assert.Equal(2, second.SortOrder);
        Assert.Equal(3, third.SortOrder);

        var reorder = await SendAsync(HttpMethod.Put, $"/api/v1/subjects/{subject.Id}/lessons/reorder",
            _owner.Token, new ReorderLessonsDto
            {
                LessonIds = new List<Guid> { third.Id, first.Id, second.Id }
            });

        Assert.Equal(HttpStatusCode.OK, reorder.StatusCode);
        var reordered = await ApiTestHelpers.ReadApiResponseAsync<List<LessonSummaryDto>>(reorder);
        var reorderedLessons = reordered.Data!;
        Assert.Equal(new[] { third.Id, first.Id, second.Id }, reorderedLessons.Select(l => l.Id));
        Assert.Equal(new[] { 1, 2, 3 }, reorderedLessons.Select(l => l.SortOrder));

        // The stored order and the public detail agree with the reorder result.
        var detail = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{subject.Id}");
        var detailBody = await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(detail);
        Assert.Equal(
            new[] { "Third", "First", "Second" },
            detailBody.Data!.Lessons.Select(l => l.Title));
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("duplicate")]
    [InlineData("foreign")]
    public async Task Invalid_reorder_lists_are_rejected_with_400(string scenario)
    {
        var subject = await CreateSubjectAsync(_owner.Token, "Subject");
        var first = await AddLessonAsync(_owner.Token, subject.Id, "First");
        var second = await AddLessonAsync(_owner.Token, subject.Id, "Second");

        var ids = scenario switch
        {
            "missing" => new List<Guid> { first.Id },
            "duplicate" => new List<Guid> { first.Id, first.Id },
            _ => new List<Guid> { first.Id, second.Id, Guid.NewGuid() }
        };

        var response = await SendAsync(HttpMethod.Put, $"/api/v1/subjects/{subject.Id}/lessons/reorder",
            _owner.Token, new ReorderLessonsDto { LessonIds = ids });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<List<LessonSummaryDto>>(response);
        Assert.False(body.Success);
    }

    [Theory]
    [InlineData("not-a-url")]
    [InlineData("ftp://example.com/file.pdf")]
    [InlineData("javascript:alert(1)")]
    public async Task Content_url_must_be_an_absolute_http_or_https_url(string contentUrl)
    {
        var subject = await CreateSubjectAsync(_owner.Token, "Subject");

        var response = await SendAsync(HttpMethod.Post, $"/api/v1/subjects/{subject.Id}/lessons",
            _owner.Token, NewLesson("Bad link", contentUrl));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(response);
        Assert.False(body.Success);
    }

    [Fact]
    public async Task Deleting_a_subject_deletes_its_lessons()
    {
        var subject = await CreateSubjectAsync(_owner.Token, "Doomed subject", isPublished: true);
        var first = await AddLessonAsync(_owner.Token, subject.Id, "First");
        var second = await AddLessonAsync(_owner.Token, subject.Id, "Second");

        var delete = await SendAsync(HttpMethod.Delete, $"/api/v1/subjects/{subject.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.OK, delete.StatusCode);

        var goneSubject = await SendAsync(HttpMethod.Get, $"/api/v1/subjects/{subject.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.NotFound, goneSubject.StatusCode);

        var goneLesson = await SendAsync(HttpMethod.Get, $"/api/v1/lessons/{first.Id}", _owner.Token);
        Assert.Equal(HttpStatusCode.NotFound, goneLesson.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var remaining = await dbContext.Lessons.CountAsync(l => l.SubjectId == subject.Id);
        Assert.Equal(0, remaining);
        Assert.False(await dbContext.Lessons.AnyAsync(l => l.Id == second.Id));
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string path,
        string? token = null,
        object? body = null,
        string? tenant = null)
        => await _client.SendAsync(
            ApiTestHelpers.CreateRequest(method, path, tenant ?? Tenant, token, body));

    private async Task<SubjectSummaryDto> CreateSubjectAsync(
        string token,
        string title,
        bool isPublished = false)
    {
        var response = await SendAsync(HttpMethod.Post, "/api/v1/subjects", token,
            new CreateSubjectDto { Title = title, Description = $"{title} description", IsPublished = isPublished });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<SubjectSummaryDto>(response);
        return body.Data!;
    }

    private async Task<LessonDto> AddLessonAsync(
        string token,
        Guid subjectId,
        string title,
        bool isPublished = false,
        string contentUrl = "https://example.com/lesson")
    {
        var response = await SendAsync(HttpMethod.Post, $"/api/v1/subjects/{subjectId}/lessons", token,
            NewLesson(title, contentUrl, isPublished));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(response);
        return body.Data!;
    }

    private static CreateLessonDto NewLesson(
        string title,
        string contentUrl = "https://example.com/lesson",
        bool isPublished = false)
        => new()
        {
            Title = title,
            Description = $"{title} description",
            ContentType = ContentType.Link,
            ContentUrl = contentUrl,
            IsPublished = isPublished
        };

    private static UpdateLessonDto NewLessonUpdate(string title)
        => new()
        {
            Title = title,
            Description = $"{title} description",
            ContentType = ContentType.Link,
            ContentUrl = "https://example.com/lesson",
            IsPublished = false
        };
}
