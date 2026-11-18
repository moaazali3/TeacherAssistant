using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Application.Common.Interfaces;

/// <summary>
/// Provides the tenant resolved for the current request.
/// On the platform domain (no tenant requested) every member is null/false.
/// </summary>
public interface ITenantService
{
    Guid? TenantId { get; }
    string? Subdomain { get; }
    Tenant? Tenant { get; }
    bool HasTenant { get; }
}
