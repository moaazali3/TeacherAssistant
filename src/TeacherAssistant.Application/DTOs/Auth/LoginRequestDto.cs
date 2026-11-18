using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}
