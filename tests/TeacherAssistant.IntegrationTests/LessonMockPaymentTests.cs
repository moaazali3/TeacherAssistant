using System.Net;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.DTOs.Payments;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.IntegrationTests;

public class LessonMockPaymentTests : IAsyncLifetime
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
            _client, Tenant, _teacher.Token, "Chemistry", "Sunday Group");
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
    public async Task Paid_lesson_unlocks_after_fawry_mock_payment_confirmation()
    {
        var createRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/subjects/{_subjectId}/lessons", Tenant, _teacher.Token,
            new CreateLessonDto
            {
                Title = "حصة العضوية المكثفة",
                ContentType = ContentType.Video,
                ContentUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                IsPublished = true,
                Price = 75m
            }));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var lesson = (await ApiTestHelpers.ReadApiResponseAsync<LessonDto>(createRes)).Data!;
        Assert.Equal(75m, lesson.Price);

        // Before payment -> locked with payment_required and GET /lessons/{id} returns 403
        var detailBefore = (await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(
            await _client.SendAsync(ApiTestHelpers.CreateRequest(
                HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", Tenant, _student.Token)))).Data!;
        var summaryBefore = Assert.Single(detailBefore.Lessons);
        Assert.True(summaryBefore.IsLocked);
        Assert.False(summaryBefore.IsPurchased);
        Assert.Equal("payment_required", summaryBefore.LockReason);

        var blockedView = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.Forbidden, blockedView.StatusCode);

        // Initiate mock Fawry payment
        var initRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/payments/lessons/{lesson.Id}/initiate", Tenant, _student.Token,
            new InitiateLessonPaymentDto { Provider = "Fawry" }));
        Assert.Equal(HttpStatusCode.OK, initRes.StatusCode);
        var session = (await ApiTestHelpers.ReadApiResponseAsync<LessonPaymentSessionDto>(initRes)).Data!;
        Assert.Equal("Fawry", session.Provider);
        Assert.StartsWith("98", session.ReferenceCode);
        Assert.Equal(PaymentStatus.Pending, session.Status);
        Assert.Equal(75m, session.Amount);
        Assert.True(session.IsMockMode);

        // Confirm mock payment -> unlocks lesson immediately
        var confirmRes = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Post, $"/api/v1/payments/purchases/{session.PurchaseId}/confirm-mock",
            Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);
        var confirmed = (await ApiTestHelpers.ReadApiResponseAsync<LessonPaymentSessionDto>(confirmRes)).Data!;
        Assert.Equal(PaymentStatus.Completed, confirmed.Status);
        Assert.NotNull(confirmed.PaidAt);

        // Now student sees lesson unlocked and can view it (200 OK)
        var detailAfter = (await ApiTestHelpers.ReadApiResponseAsync<SubjectDetailDto>(
            await _client.SendAsync(ApiTestHelpers.CreateRequest(
                HttpMethod.Get, $"/api/v1/subjects/{_subjectId}", Tenant, _student.Token)))).Data!;
        var summaryAfter = Assert.Single(detailAfter.Lessons);
        Assert.False(summaryAfter.IsLocked);
        Assert.True(summaryAfter.IsPurchased);

        var unlockedView = await _client.SendAsync(ApiTestHelpers.CreateRequest(
            HttpMethod.Get, $"/api/v1/lessons/{lesson.Id}", Tenant, _student.Token));
        Assert.Equal(HttpStatusCode.OK, unlockedView.StatusCode);
    }
}
