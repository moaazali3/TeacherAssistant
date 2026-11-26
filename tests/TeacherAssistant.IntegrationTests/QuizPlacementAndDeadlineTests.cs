using System.Net;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Quizzes;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

public class QuizPlacementAndDeadlineTests : IAsyncLifetime
{
    private const string Tenant = "quiz-rules";
    private readonly ApiFactory _factory = new();
    private HttpClient _client = null!;
    private AuthResponseDto _teacher = null!;
    private AuthResponseDto _student = null!;
    private Guid _subjectId;
    private Guid _lessonId;

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
        _client = _factory.CreateClient();

        _teacher = await ApiTestHelpers.RegisterTeacherAsync(
            _client, Tenant, "teacher@quiz-rules.example", "Quiz Rules Academy");

        var (subjectId, _, joinCode) = await ApiTestHelpers.CreateSubjectWithGroupAsync(
            _client, Tenant, _teacher.Token, "Physics", "Group A");
        _subjectId = subjectId;

        var lessonRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/lessons", Tenant, _teacher.Token,
            new CreateLessonDto
            {
                Title = "الفصل الأول: التيار الكهربي",
                ContentType = ContentType.Video,
                ContentUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                IsPublished = true
            }));
        Assert.Equal(HttpStatusCode.Created, lessonRes.StatusCode);
        _lessonId = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(lessonRes)).Data!.Id;

        var studentRes = await ApiTestHelpers.RegisterStudentAsync(
            _client, Tenant, "student@quiz-rules.example", joinCode);
        Assert.Equal(HttpStatusCode.OK, studentRes.StatusCode);
        _student = (await ApiTestHelpers.ReadApiResponseAsync<AuthResponseDto>(studentRes)).Data!;
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Pre_lesson_quiz_locks_lecture_until_student_submits_it()
    {
        var createRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/quizzes", Tenant, _teacher.Token,
            new CreateQuizDto
            {
                Title = "كويز تهيئة قبل المحاضرة",
                LessonId = _lessonId,
                Type = AssessmentType.Homework,
                Placement = AssessmentPlacement.BeforeLesson,
                IsPublished = true,
                Questions =
                [
                    new QuizQuestionDto
                    {
                        Id = "q1",
                        Prompt = "وحدة قياس شدة التيار الكهربي؟",
                        Options = ["الأمبير", "الفولت"],
                        CorrectOptionIndex = 0,
                        Points = 5
                    }
                ]
            }));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var preQuiz = (await ApiTestHelpers.ReadApiResponseAsync<QuizDetailDto>(createRes)).Data!;
        Assert.Equal(AssessmentPlacement.BeforeLesson, preQuiz.Placement);

        // Lesson is locked for the student before solving pre-lesson quiz
        var detailBefore = (await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(
            await _client.SendAsync(ApiTestHelpers.CreateRequest(
                HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", Tenant, _student.Token)))).Data!;
        var summaryBefore = Assert.Single(detailBefore.Lessons);
        Assert.True(summaryBefore.IsLocked);
        Assert.Equal("pre_quiz_required", summaryBefore.LockReason);

        var blockedLesson = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{_lessonId}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.Forbidden, blockedLesson.StatusCode);

        // Submit pre-lesson quiz
        var submitRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/quizzes/{preQuiz.Id}/submit-answers", Tenant, _student.Token,
            new SubmitQuizAnswersDto { Answers = new Dictionary<string, int> { ["q1"] = 0 } }));
        Assert.Equal(HttpStatusCode.OK, submitRes.StatusCode);

        // Lesson unlocks immediately
        var detailAfter = (await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(
            await _client.SendAsync(ApiTestHelpers.CreateRequest(
                HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", Tenant, _student.Token)))).Data!;
        var summaryAfter = Assert.Single(detailAfter.Lessons);
        Assert.False(summaryAfter.IsLocked);
        Assert.Null(summaryAfter.LockReason);

        var openLesson = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{_lessonId}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, openLesson.StatusCode);
    }

    [Fact]
    public async Task Expired_deadline_and_future_schedule_block_student_submission()
    {
        // 1. Expired deadline
        var expiredRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/quizzes", Tenant, _teacher.Token,
            new CreateQuizDto
            {
                Title = "واجب منتهي الديدلاين",
                LessonId = _lessonId,
                Type = AssessmentType.Homework,
                Placement = AssessmentPlacement.AfterLesson,
                DueAt = DateTime.UtcNow.AddHours(-1),
                IsPublished = true,
                Questions =
                [
                    new QuizQuestionDto
                    {
                        Id = "q1",
                        Prompt = "سؤال تجريبي؟",
                        Options = ["أ", "ب"],
                        CorrectOptionIndex = 0,
                        Points = 5
                    }
                ]
            }));
        Assert.Equal(HttpStatusCode.Created, expiredRes.StatusCode);
        var expiredQuiz = (await ApiTestHelpers.ReadApiResponseAsync<QuizDetailDto>(expiredRes)).Data!;

        var lateSubmit = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/quizzes/{expiredQuiz.Id}/submit-answers", Tenant, _student.Token,
            new SubmitQuizAnswersDto { Answers = new Dictionary<string, int> { ["q1"] = 0 } }));
        Assert.Equal(HttpStatusCode.Forbidden, lateSubmit.StatusCode);

        // 2. Future schedule
        var futureRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/quizzes", Tenant, _teacher.Token,
            new CreateQuizDto
            {
                Title = "امتحان مجدول مستقبلاً",
                LessonId = _lessonId,
                Type = AssessmentType.Exam,
                Placement = AssessmentPlacement.AfterLesson,
                DurationMinutes = 20,
                AvailableFrom = DateTime.UtcNow.AddHours(2),
                DueAt = DateTime.UtcNow.AddHours(4),
                IsPublished = true,
                Questions =
                [
                    new QuizQuestionDto
                    {
                        Id = "q1",
                        Prompt = "سؤال مستقبلي؟",
                        Options = ["نعم", "لا"],
                        CorrectOptionIndex = 0,
                        Points = 5
                    }
                ]
            }));
        Assert.Equal(HttpStatusCode.Created, futureRes.StatusCode);
        var futureQuiz = (await ApiTestHelpers.ReadApiResponseAsync<QuizDetailDto>(futureRes)).Data!;

        var earlyDetail = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/quizzes/{futureQuiz.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.Forbidden, earlyDetail.StatusCode);

        var earlySubmit = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/quizzes/{futureQuiz.Id}/submit-answers", Tenant, _student.Token,
            new SubmitQuizAnswersDto { Answers = new Dictionary<string, int> { ["q1"] = 0 } }));
        Assert.Equal(HttpStatusCode.Forbidden, earlySubmit.StatusCode);
    }
}
