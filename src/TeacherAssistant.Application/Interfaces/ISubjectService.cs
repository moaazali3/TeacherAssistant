using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Subjects;

namespace TeacherAssistant.Application.Interfaces;

public interface ISubjectService
{
    // Instructor endpoints
    Task<ServiceResult<IReadOnlyList<SubjectSummaryDto>>> GetMySubjectsAsync(
        CancellationToken cancellationToken = default);

    Task<ServiceResult<SubjectSummaryDto>> CreateSubjectAsync(
        CreateSubjectDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<SubjectDetailDto>> UpdateSubjectAsync(
        Guid subjectId, UpdateSubjectDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<string>> DeleteSubjectAsync(
        Guid subjectId, CancellationToken cancellationToken = default);

    Task<ServiceResult<LessonDto>> AddLessonAsync(
        Guid subjectId, CreateLessonDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<LessonDto>> UpdateLessonAsync(
        Guid lessonId, UpdateLessonDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<string>> DeleteLessonAsync(
        Guid lessonId, CancellationToken cancellationToken = default);

    Task<ServiceResult<IReadOnlyList<LessonSummaryDto>>> ReorderLessonsAsync(
        Guid subjectId, ReorderLessonsDto request, CancellationToken cancellationToken = default);

    // Public / authenticated reads
    Task<ServiceResult<IReadOnlyList<SubjectSummaryDto>>> GetSubjectsAsync(
        CancellationToken cancellationToken = default);

    Task<ServiceResult<SubjectDetailDto>> GetSubjectDetailAsync(
        Guid subjectId, CancellationToken cancellationToken = default);

    Task<ServiceResult<LessonDto>> GetLessonAsync(
        Guid lessonId, CancellationToken cancellationToken = default);

    Task<ServiceResult<LessonDto>> MarkLessonCompletedAsync(
        Guid lessonId, CancellationToken cancellationToken = default);
}
