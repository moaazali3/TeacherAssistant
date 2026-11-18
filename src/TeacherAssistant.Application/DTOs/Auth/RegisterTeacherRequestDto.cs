using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;

namespace TeacherAssistant.Application.DTOs.Auth;

public class RegisterTeacherRequestDto
{
    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, StrongPassword]
    public string Password { get; set; } = string.Empty;

    /// <summary>Lowercase subdomain, for example "ahmed" for ahmed.ourplatform.com.</summary>
    [Required, StringLength(63, MinimumLength = 3)]
    public string Subdomain { get; set; } = string.Empty;

    /// <summary>Public business name. Falls back to the teacher's name when omitted.</summary>
    [StringLength(150, MinimumLength = 2)]
    public string? TenantName { get; set; }

    [Url, StringLength(500)]
    public string? LogoUrl { get; set; }

    [RegularExpression("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$",
        ErrorMessage = "PrimaryColor must be a hex color such as #0F766E.")]
    public string? PrimaryColor { get; set; }

    [StringLength(1000)]
    public string? Bio { get; set; }
}
