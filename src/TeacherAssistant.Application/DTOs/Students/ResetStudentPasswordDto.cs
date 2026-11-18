using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;

namespace TeacherAssistant.Application.DTOs.Students;

public class ResetStudentPasswordDto
{
    [Required, StrongPassword]
    public string NewPassword { get; set; } = string.Empty;
}
