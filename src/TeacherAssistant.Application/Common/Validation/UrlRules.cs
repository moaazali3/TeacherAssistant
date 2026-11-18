namespace TeacherAssistant.Application.Common.Validation;

public static class UrlRules
{
    public static bool IsHttpUrl(string? value)
        => !string.IsNullOrWhiteSpace(value)
           && Uri.TryCreate(value, UriKind.Absolute, out var uri)
           && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
