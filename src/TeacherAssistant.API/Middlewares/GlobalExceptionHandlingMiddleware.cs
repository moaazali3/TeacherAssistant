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
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation("Request {Method} {Path} was canceled by the client.",
                context.Request.Method, context.Request.Path);
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 499;
            }
        }
        catch (BadHttpRequestException ex)
        {
            _logger.LogWarning(ex, "Bad HTTP request ({StatusCode}) on {Method} {Path}: {Message}",
                ex.StatusCode, context.Request.Method, context.Request.Path, ex.Message);
            await WriteErrorResponseAsync(
                context,
                ex.StatusCode,
                ex.StatusCode == StatusCodes.Status413PayloadTooLarge
                    ? "Request payload exceeds the allowed size limit."
                    : "The HTTP request is malformed.",
                _includeDetails ? new List<string> { ex.Message } : new List<string>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex, _includeDetails);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, bool includeDetails)
    {
        await WriteErrorResponseAsync(
            context,
            (int)HttpStatusCode.InternalServerError,
            "An unexpected error occurred. Please try again later.",
            includeDetails ? new List<string> { exception.Message } : new List<string>());
    }

    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        int statusCode,
        string message,
        List<string> errors)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = ApiResponse<string>.FailureResponse(message, errors);

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
