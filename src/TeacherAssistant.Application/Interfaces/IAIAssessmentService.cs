using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Quizzes;

namespace TeacherAssistant.Application.Interfaces;

public interface IAIAssessmentService
{
    Task<ApiResponse<QuizDto>> GenerateQuizFromPdfAsync(GenerateQuizRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<SubmissionResultDto>> SubmitQuizAsync(Guid quizId, SubmitQuizRequestDto request, CancellationToken cancellationToken = default);
}
