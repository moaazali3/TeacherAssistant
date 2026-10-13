using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Auth;

public class RegisterRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;
    public string? TenantId { get; set; }
}
