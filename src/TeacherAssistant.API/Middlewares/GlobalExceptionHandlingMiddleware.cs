using System.Net;
using System.Text.Json;
using TeacherAssistant.Application.Common.Models;

namespace TeacherAssistant.API.Middlewares;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    private readonly bool _includeDetails;

    public GlobalExceptionHandlingMiddleware(
        RequestDelegate _next,
        ILogger<GlobalExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        this._next = _next;
        _logger = logger;

        // Production (and any other deployed environment) gets the generic message only.
        // Internal details stay available locally and in tests.
        _includeDetails = environment.IsDevelopment()
            || environment.IsEnvironment("Testing");
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex, _includeDetails);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, bool includeDetails)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = ApiResponse<string>.FailureResponse(
            "An unexpected error occurred. Please try again later.",
            includeDetails ? new List<string> { exception.Message } : new List<string>());

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
