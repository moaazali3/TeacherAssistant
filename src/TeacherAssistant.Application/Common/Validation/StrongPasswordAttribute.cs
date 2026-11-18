using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.Common.Validation;

/// <summary>
/// Shared password rule for account creation and password resets:
/// 8-100 characters with at least one letter and at least one digit.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class StrongPasswordAttribute : ValidationAttribute
{
    public int MinimumLength { get; init; } = 8;
    public int MaximumLength { get; init; } = 100;

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // [Required] reports the missing value; this attribute only checks the shape.
        if (value is not string password || password.Length == 0)
            return ValidationResult.Success;

        if (password.Length < MinimumLength || password.Length > MaximumLength)
        {
            return new ValidationResult(
                $"Password must be between {MinimumLength} and {MaximumLength} characters.");
        }

        var hasLetter = password.Any(char.IsLetter);
        var hasDigit = password.Any(char.IsDigit);

        return hasLetter && hasDigit
            ? ValidationResult.Success
            : new ValidationResult("Password must contain at least one letter and one digit.");
    }
}
