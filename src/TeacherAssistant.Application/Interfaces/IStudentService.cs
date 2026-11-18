using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Students;

namespace TeacherAssistant.Application.Interfaces;

public interface IStudentService
{
    Task<ServiceResult<string>> ResetPasswordAsync(
        Guid studentId, ResetStudentPasswordDto request, CancellationToken cancellationToken = default);
}
