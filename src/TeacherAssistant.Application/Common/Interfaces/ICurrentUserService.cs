namespace TeacherAssistant.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    Guid? TenantId { get; }
    bool IsAuthenticated { get; }
}
