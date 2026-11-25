using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;

namespace TeacherAssistant.Application.DTOs.Tenants;

/// <summary>
/// Null values leave the field unchanged; an empty string clears optional fields.
/// </summary>
public class UpdateTenantBrandingDto
{
    [StringLength(150, MinimumLength = 2)]
    public string? Name { get; set; }

    [HttpUrl, StringLength(500)]
    public string? LogoUrl { get; set; }

    [RegularExpression("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$",
        ErrorMessage = "PrimaryColor must be a hex color such as #0F766E.")]
    public string? PrimaryColor { get; set; }

    [StringLength(1000)]
    public string? Bio { get; set; }
}
