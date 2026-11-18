using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.Common.Validation;

/// <summary>
/// Accepts only absolute http/https URLs. Null/empty values are allowed here so that
/// optional fields can be cleared and [Required] can own the "must be provided" rule.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class HttpUrlAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        if (value is string text && string.IsNullOrWhiteSpace(text)) return true;

        return value is string url && UrlRules.IsHttpUrl(url);
    }

    public override string FormatErrorMessage(string name)
        => $"{name} must be a valid http or https URL.";
}
