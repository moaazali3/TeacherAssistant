using System.Security.Claims;
using TeacherAssistant.Application.Common.Interfaces;

namespace TeacherAssistant.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userIdStr, out var userId) ? userId : null;
        }
    }

    public string? Email =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);

    public string? Role =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);

    public Guid? TenantId
    {
        get
        {
            var tenantIdStr = _httpContextAccessor.HttpContext?.User?.FindFirstValue("tenantId");
            return Guid.TryParse(tenantIdStr, out var tenantId) ? tenantId : null;
        }
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
