using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Quizzes;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class QuizzesController : BaseApiController
{
    private readonly IAIAssessmentService _aiAssessmentService;
    private readonly IQuizService _quizService;

    public QuizzesController(
        IAIAssessmentService aiAssessmentService,
        IQuizService quizService)
    {
        _aiAssessmentService = aiAssessmentService;
        _quizService = quizService;
    }

    /// <summary>List Homeworks & Exams for a subject (staff sees all; student sees published + own submission).</summary>
    [HttpGet("/api/v1/subjects/{subjectId:guid}/quizzes")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QuizSummaryItemDto>>>> GetSubjectQuizzes(
        [FromRoute] Guid subjectId,
        CancellationToken cancellationToken)
        => Map(await _quizService.GetSubjectQuizzesAsync(subjectId, cancellationToken));

    /// <summary>Create a Homework or timed MCQ Exam for a subject.</summary>
    [HttpPost("/api/v1/subjects/{subjectId:guid}/quizzes")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOrAssistant)]
    public async Task<ActionResult<ApiResponse<QuizDetailDto>>> CreateQuiz(
        [FromRoute] Guid subjectId,
        [FromBody] CreateQuizDto request,
        CancellationToken cancellationToken)
        => Map(await _quizService.CreateQuizAsync(subjectId, request, cancellationToken));

    /// <summary>Get quiz questions (answer keys hidden for students prior to submission).</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<QuizDetailDto>>> GetById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _quizService.GetQuizDetailAsync(id, cancellationToken));

    /// <summary>Delete a quiz or homework.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOrAssistant)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _quizService.DeleteQuizAsync(id, cancellationToken));

    /// <summary>Submit MCQ answers as a student and receive instant auto-grading.</summary>
    [HttpPost("{id:guid}/submit-answers")]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    public async Task<ActionResult<ApiResponse<StudentQuizSubmissionSummaryDto>>> SubmitAnswers(
        [FromRoute] Guid id,
        [FromBody] SubmitQuizAnswersDto request,
        CancellationToken cancellationToken)
        => Map(await _quizService.SubmitQuizAnswersAsync(id, request, cancellationToken));

    /// <summary>
    /// POST /api/v1/quizzes/generate-from-pdf - معالجة ملف PDF وتوليد أسئلة ذكاء اصطناعي
    /// </summary>
    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost("generate-from-pdf")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<QuizDto>>> GenerateFromPdf(
        [FromForm] Guid subjectId,
        [FromForm] Guid? lessonId,
        [FromForm] string title,
        [FromForm] int numberOfQuestions,
        [FromForm] string difficultyLevel,
        IFormFile pdfFile,
        CancellationToken cancellationToken)
    {
        if (pdfFile == null || pdfFile.Length == 0)
        {
            return BadRequest(ApiResponse<QuizDto>.FailureResponse("A valid PDF file is required."));
        }

        using var memoryStream = new MemoryStream();
        await pdfFile.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        var requestDto = new GenerateQuizRequestDto
        {
            SubjectId = subjectId,
            LessonId = lessonId,
            Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(pdfFile.FileName) : title,
            NumberOfQuestions = numberOfQuestions <= 0 ? 5 : numberOfQuestions,
            DifficultyLevel = difficultyLevel ?? "Medium",
            FileStream = memoryStream,
            FileName = pdfFile.FileName
        };

        var response = await _aiAssessmentService.GenerateQuizFromPdfAsync(requestDto, cancellationToken);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    /// <summary>
    /// POST /api/v1/quizzes/{id}/submit - تسليم إجابات الطالب للتقييم الآلي
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPost("{id:guid}/submit")]
    public async Task<ActionResult<ApiResponse<SubmissionResultDto>>> SubmitQuiz(
        [FromRoute] Guid id,
        [FromBody] SubmitQuizRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _aiAssessmentService.SubmitQuizAsync(id, request, cancellationToken);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    private ActionResult<ApiResponse<T>> Map<T>(ServiceResult<T> result)
        => StatusCode(result.StatusCode, result.Response);
}
