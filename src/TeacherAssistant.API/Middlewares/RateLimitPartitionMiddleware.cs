using System.Text;
using System.Text.Json;

namespace TeacherAssistant.API.Middlewares;

/// <summary>
/// The built-in rate limiter partitions on values that are already available on
/// <see cref="HttpContext"/>. Login also needs the email from the JSON body, so the
/// body is buffered once here, before <c>UseRateLimiter</c>, and the email is stored
/// in <see cref="HttpContext.Items"/> for the partition key.
/// </summary>
public sealed class RateLimitPartitionMiddleware
{
    public const string LoginEmailItemKey = "RateLimit.LoginEmail";

    private const string LoginPath = "/api/v1/auth/login";

    private readonly RequestDelegate _next;

    public RateLimitPartitionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (IsLoginRequest(context))
        {
            await RememberLoginEmailAsync(context);
        }

        await _next(context);
    }

    public static string ClientIp(HttpContext context)
        => context.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";

    public static string LoginPartitionKey(HttpContext context)
    {
        var email = context.Items[LoginEmailItemKey] as string ?? "unknown-email";
        return $"{ClientIp(context)}|{email}";
    }

    private static bool IsLoginRequest(HttpContext context)
    {
        if (!HttpMethods.IsPost(context.Request.Method))
            return false;

        var path = context.Request.Path.Value?.TrimEnd('/');
        return string.Equals(path, LoginPath, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task RememberLoginEmailAsync(HttpContext context)
    {
        context.Request.EnableBuffering();

        try
        {
            using var reader = new StreamReader(
                context.Request.Body,
                Encoding.UTF8,
                detectEncodingFromByteOrderMarks: false,
                bufferSize: 1024,
                leaveOpen: true);

            var body = await reader.ReadToEndAsync(context.RequestAborted);
            if (string.IsNullOrWhiteSpace(body))
                return;

            using var document = JsonDocument.Parse(body);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
                return;

            // JSON property names are matched case-insensitively, like MVC's model binder.
            var email = document.RootElement
                .EnumerateObject()
                .FirstOrDefault(property =>
                    string.Equals(property.Name, "email", StringComparison.OrdinalIgnoreCase));

            if (email.Value.ValueKind == JsonValueKind.String)
            {
                context.Items[LoginEmailItemKey] =
                    email.Value.GetString()?.Trim().ToLowerInvariant() ?? "unknown-email";
            }
        }
        catch (JsonException)
        {
            // Invalid JSON is reported by model validation later; it just uses a shared partition.
        }
        finally
        {
            // Rewind so MVC can still bind [FromBody].
            context.Request.Body.Position = 0;
        }
    }
}
