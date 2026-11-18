namespace TeacherAssistant.Application.Common;

/// <summary>
/// Single source of truth for subdomain validation shared by registration and the
/// availability endpoint.
/// </summary>
public static class SubdomainRules
{
    private static readonly HashSet<string> Reserved = new(StringComparer.OrdinalIgnoreCase)
    {
        "www", "api", "admin", "app", "mail", "support"
    };

    public static string Normalize(string value) => value.Trim().ToLowerInvariant();

    public static bool IsReserved(string value) => Reserved.Contains(value);

    public static bool IsValidFormat(string value)
    {
        if (value.Length is < 3 or > 63) return false;

        // Lowercase letters, digits and inner hyphens only; must start/end alphanumeric.
        foreach (var c in value)
        {
            if (!(char.IsAsciiLetterLower(c) || char.IsAsciiDigit(c) || c == '-'))
                return false;
        }

        return !value.StartsWith('-') && !value.EndsWith('-');
    }
}
