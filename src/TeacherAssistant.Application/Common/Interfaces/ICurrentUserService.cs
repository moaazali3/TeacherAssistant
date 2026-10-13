namespace TeacherAssistant.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    string? TenantId { get; }
    bool IsAuthenticated { get; }
}
