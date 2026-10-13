using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Quizzes;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class QuizzesController : BaseApiController
{
    private readonly IAIAssessmentService _aiAssessmentService;

    public QuizzesController(IAIAssessmentService aiAssessmentService)
    {
        _aiAssessmentService = aiAssessmentService;
    }

    /// <summary>
    /// POST /api/v1/quizzes/generate-from-pdf - معالجة ملف PDF وتوليد أسئلة ذكاء اصطناعي
    /// </summary>
    [Authorize(Roles = "Instructor,Admin")]
    [HttpPost("generate-from-pdf")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<QuizDto>>> GenerateFromPdf(
        [FromForm] Guid courseId,
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
            CourseId = courseId,
            LessonId = lessonId,
            Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(pdfFile.FileName) : title,
            NumberOfQuestions = numberOfQuestions <= 0 ? 5 : numberOfQuestions,
            DifficultyLevel = difficultyLevel ?? "Medium",
            FileStream = memoryStream,
            FileName = pdfFile.FileName
        };

        var response = await _aiAssessmentService.GenerateQuizFromPdfAsync(requestDto, cancellationToken);
        return Ok(response);
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
        return Ok(response);
    }
}
