namespace TeacherAssistant.Application.Common.Models;

/// <summary>
/// Carries the HTTP status an endpoint should return together with the unified
/// response body. Services never build MVC results themselves.
/// </summary>
public sealed class ServiceResult<T>
{
    private ServiceResult(int statusCode, ApiResponse<T> response)
    {
        StatusCode = statusCode;
        Response = response;
    }

    public int StatusCode { get; }
    public ApiResponse<T> Response { get; }

    public static ServiceResult<T> Ok(T data, string message = "Operation completed successfully.")
        => new(200, ApiResponse<T>.SuccessResponse(data, message));

    public static ServiceResult<T> Created(T data, string message = "Created successfully.")
        => new(201, ApiResponse<T>.SuccessResponse(data, message));

    public static ServiceResult<T> BadRequest(string message, List<string>? errors = null)
        => new(400, ApiResponse<T>.FailureResponse(message, errors));

    public static ServiceResult<T> Forbidden(string message = "You do not have permission to perform this action.")
        => new(403, ApiResponse<T>.FailureResponse(message));

    public static ServiceResult<T> NotFound(string message = "The requested resource was not found.")
        => new(404, ApiResponse<T>.FailureResponse(message));

    public static ServiceResult<T> Conflict(string message)
        => new(409, ApiResponse<T>.FailureResponse(message));
}
