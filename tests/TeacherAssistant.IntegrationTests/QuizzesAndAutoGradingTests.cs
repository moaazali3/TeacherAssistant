using System.Net;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Quizzes;
using TeacherAssistant.Application.DTOs.Students;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

public class QuizzesAndAutoGradingTests : IAsyncLifetime
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
            _client, Tenant, _teacher.Token, "Physics", "Sunday 5pm");
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
    public async Task Teacher_creates_exam_and_homework_and_student_submission_auto_grades_and_updates_progress()
    {
        // Create timed Exam (2 questions = 15 points total)
        var examRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/quizzes", Tenant, _teacher.Token,
            new CreateQuizDto
            {
                Title = "امتحان الباب الأول",
                Type = AssessmentType.Exam,
                DurationMinutes = 30,
                PassingScorePercent = 60,
                IsPublished = true,
                Questions = new List<QuizQuestionDto>
                {
                    new()
                    {
                        Id = "q1",
                        Prompt = "ما وحدة قياس شدة التيار؟",
                        Options = new List<string> { "فولت", "أمبير", "أوم", "وات" },
                        CorrectOptionIndex = 1,
                        Points = 10
                    },
                    new()
                    {
                        Id = "q2",
                        Prompt = "قانون أوم يربط بين الجهد والمقاومة والتيار.",
                        Options = new List<string> { "صح", "خطأ" },
                        CorrectOptionIndex = 0,
                        Points = 5
                    }
                }
            }));
        Assert.Equal(HttpStatusCode.Created, examRes.StatusCode);
        var exam = (await ApiTestHelpers.ReadApiResponseAsync<QuizDetailDto>(examRes)).Data!;
        Assert.Equal(15m, exam.TotalScore);
        Assert.Equal(AssessmentType.Exam, exam.Type);

        // Create Homework
        var hwRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/quizzes", Tenant, _teacher.Token,
            new CreateQuizDto
            {
                Title = "واجب الحصة الأولى",
                Type = AssessmentType.Homework,
                PassingScorePercent = 50,
                IsPublished = true,
                Questions = new List<QuizQuestionDto>
                {
                    new()
                    {
                        Id = "h1",
                        Prompt = "التيار المستمر ثابت الشدة والاتجاه.",
                        Options = new List<string> { "صح", "خطأ" },
                        CorrectOptionIndex = 0,
                        Points = 10
                    }
                }
            }));
        Assert.Equal(HttpStatusCode.Created, hwRes.StatusCode);

        // Student fetches exam -> answer key must be stripped (null)!
        var studentFetchRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/quizzes/{exam.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, studentFetchRes.StatusCode);
        var studentExam = (await ApiTestHelpers.ReadApiResponseAsync<QuizDetailDto>(studentFetchRes)).Data!;
        Assert.All(studentExam.Questions, q => Assert.Null(q.CorrectOptionIndex));

        // Student submits 1 right (10 pts) + 1 wrong (0 pts) => 10/15 = 66.7% >= 60% Passed
        var submitRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/quizzes/{exam.Id}/submit-answers", Tenant, _student.Token,
            new SubmitQuizAnswersDto
            {
                Answers = new Dictionary<string, int>
                {
                    ["q1"] = 1,
                    ["q2"] = 1
                }
            }));
        Assert.Equal(HttpStatusCode.OK, submitRes.StatusCode);
        var result = (await ApiTestHelpers.ReadApiResponseAsync<StudentQuizSubmissionSummaryDto>(submitRes)).Data!;
        Assert.Equal(10m, result.Score);
        Assert.Equal(15m, result.TotalScore);
        Assert.True(result.Passed);
        Assert.True(result.Percentage >= 66m);

        // Duplicate submission is rejected with 409 Conflict
        var dupRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/quizzes/{exam.Id}/submit-answers", Tenant, _student.Token,
            new SubmitQuizAnswersDto { Answers = new Dictionary<string, int> { ["q1"] = 1 } }));
        Assert.Equal(HttpStatusCode.Conflict, dupRes.StatusCode);

        // Teacher checks Student 360 progress -> CompletedQuizzes=1, PendingQuizzesCount=1
        var progressRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/students/{_student.UserId}/progress", Tenant, _teacher.Token));
        Assert.Equal(HttpStatusCode.OK, progressRes.StatusCode);
        var progress = (await ApiTestHelpers.ReadApiResponseAsync<StudentProgressDto>(progressRes)).Data!;
        Assert.Equal(2, progress.TotalQuizzesAvailable);
        Assert.Equal(1, progress.CompletedQuizzes);
        Assert.Equal(1, progress.PendingQuizzesCount);
        Assert.Single(progress.CompletedSubmissions);
        Assert.Single(progress.PendingQuizzes);
        Assert.Equal("واجب الحصة الأولى", progress.PendingQuizzes[0].QuizTitle);
    }
}
