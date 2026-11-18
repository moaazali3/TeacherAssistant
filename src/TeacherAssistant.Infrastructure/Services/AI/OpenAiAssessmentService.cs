using Microsoft.Extensions.Options;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Quizzes;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Infrastructure.Settings;

namespace TeacherAssistant.Infrastructure.Services.AI;

public class OpenAiAssessmentService : IAIAssessmentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly OpenAiSettings _openAiSettings;

    public OpenAiAssessmentService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IOptions<OpenAiSettings> openAiOptions)
    {
        _context = context;
        _currentUserService = currentUserService;
        _openAiSettings = openAiOptions.Value;
    }

    public async Task<ApiResponse<QuizDto>> GenerateQuizFromPdfAsync(GenerateQuizRequestDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Extract text from the uploaded PDF stream (using PdfPig / iText / UglyToad.PdfPig)
        // 2. Call OpenAI API / LLM Parsing Service with prompt asking for JSON quiz questions & choices
        // 3. Parse JSON response from LLM
        // 4. Persist generated Quiz entity into _context.Quizzes
        // 5. Return QuizDto
        await Task.CompletedTask;
        return ApiResponse<QuizDto>.SuccessResponse(new QuizDto
        {
            Id = Guid.NewGuid(),
            SubjectId = request.SubjectId,
            LessonId = request.LessonId,
            Title = request.Title,
            QuestionsData = "[{\"question\":\"What is the main concept of Clean Architecture?\",\"options\":[\"Separation of concerns\",\"Tight coupling\",\"Direct DB in UI\",\"None\"],\"answer\":0}]",
            TotalScore = 10,
            CreatedAt = DateTime.UtcNow
        }, "AI Quiz generation stub executed.");
    }

    public async Task<ApiResponse<SubmissionResultDto>> SubmitQuizAsync(Guid quizId, SubmitQuizRequestDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Fetch Quiz by quizId
        // 2. Compare student's answers with Quiz questions key (or pass to AI for evaluation)
        // 3. Calculate Score and generate automated feedback
        // 4. Store Submission entity into _context.Submissions
        await Task.CompletedTask;
        return ApiResponse<SubmissionResultDto>.SuccessResponse(new SubmissionResultDto
        {
            SubmissionId = Guid.NewGuid(),
            QuizId = quizId,
            StudentId = _currentUserService.UserId ?? Guid.NewGuid(),
            Score = 10,
            TotalScore = 10,
            Feedback = "Well done! Auto-graded by Teacher Assistant AI engine.",
            SubmittedAt = DateTime.UtcNow
        }, "Quiz submission stub evaluated.");
    }
}
