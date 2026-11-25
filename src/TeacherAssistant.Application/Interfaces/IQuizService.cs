using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Quizzes;

namespace TeacherAssistant.Application.Interfaces;

public interface IQuizService
{
    Task<ServiceResult<IReadOnlyList<QuizSummaryItemDto>>> GetSubjectQuizzesAsync(
        Guid subjectId, CancellationToken cancellationToken = default);

    Task<ServiceResult<QuizDetailDto>> GetQuizDetailAsync(
        Guid quizId, CancellationToken cancellationToken = default);

    Task<ServiceResult<QuizDetailDto>> CreateQuizAsync(
        Guid subjectId, CreateQuizDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<string>> DeleteQuizAsync(
        Guid quizId, CancellationToken cancellationToken = default);

    Task<ServiceResult<StudentQuizSubmissionSummaryDto>> SubmitQuizAnswersAsync(
        Guid quizId, SubmitQuizAnswersDto request, CancellationToken cancellationToken = default);
}
