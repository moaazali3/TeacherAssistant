using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Students;

namespace TeacherAssistant.Application.Interfaces;

public interface IStudentService
{
    Task<ServiceResult<IReadOnlyList<StudentSummaryDto>>> GetStudentsAsync(
        string? search = null, CancellationToken cancellationToken = default);
    Task<ServiceResult<StudentProgressDto>> GetStudentProgressAsync(
        Guid studentId, CancellationToken cancellationToken = default);
    Task<ServiceResult<string>> ResetPasswordAsync(
        Guid studentId, ResetStudentPasswordDto request, CancellationToken cancellationToken = default);
}
