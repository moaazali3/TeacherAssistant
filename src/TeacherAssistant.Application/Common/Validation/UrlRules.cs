namespace TeacherAssistant.Application.Common.Validation;

public static class UrlRules
{
    public static bool IsHttpUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var trimmed = value.Trim();

        // Allow safe relative storage or bundled image paths without directory traversal.
        if ((trimmed.StartsWith("/storage/", StringComparison.OrdinalIgnoreCase) ||
             trimmed.StartsWith("/images/", StringComparison.OrdinalIgnoreCase)) &&
            !trimmed.Contains("..", StringComparison.Ordinal))
        {
            return true;
        }

        return Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
