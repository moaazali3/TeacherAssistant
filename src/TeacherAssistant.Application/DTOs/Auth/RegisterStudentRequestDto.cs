using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;

namespace TeacherAssistant.Application.DTOs.Auth;

public class RegisterStudentRequestDto
{
    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, StrongPassword]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "رقم هاتف الطالب مطلوب.")]
    [StringLength(20)]
    [RegularExpression(@"^\+?[0-9]{10,15}$", ErrorMessage = "رقم هاتف الطالب غير صحيح.")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "رقم هاتف ولي الأمر مطلوب.")]
    [StringLength(20)]
    [RegularExpression(@"^\+?[0-9]{10,15}$", ErrorMessage = "رقم هاتف ولي الأمر غير صحيح.")]
    public string ParentPhoneNumber { get; set; } = string.Empty;

    /// <summary>The teacher-provided group code. Required: students cannot self-register freely.</summary>
    [Required(ErrorMessage = "A group join code is required.")]
    [StringLength(8, MinimumLength = 8, ErrorMessage = "The join code must be exactly 8 characters.")]
    public string JoinCode { get; set; } = string.Empty;
}
