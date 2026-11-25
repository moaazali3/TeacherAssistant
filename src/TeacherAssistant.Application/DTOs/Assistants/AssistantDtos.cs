using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Assistants;

public class AssistantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public AssistantPermissions Permissions { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAssistantDto
{
    [Required(ErrorMessage = "الاسم الكامل مطلوب.")]
    [StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "البريد الإلكتروني مطلوب.")]
    [EmailAddress(ErrorMessage = "صيغة البريد الإلكتروني غير صحيحة.")]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, StrongPassword]
    public string Password { get; set; } = string.Empty;

    [StringLength(20)]
    [RegularExpression(@"^$|^\+?[0-9]{10,15}$", ErrorMessage = "رقم الهاتف غير صحيح.")]
    public string? PhoneNumber { get; set; }

    public AssistantPermissions Permissions { get; set; } = AssistantPermissions.ViewStudentProgress;
}

public class UpdateAssistantPermissionsDto
{
    public AssistantPermissions Permissions { get; set; }
}
