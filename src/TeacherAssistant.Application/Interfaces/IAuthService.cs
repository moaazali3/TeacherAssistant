using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;

namespace TeacherAssistant.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterTeacherAsync(RegisterTeacherRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuthResponseDto>> RegisterStudentAsync(RegisterStudentRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}
