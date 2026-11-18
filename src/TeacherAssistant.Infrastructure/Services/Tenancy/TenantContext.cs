using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Services.Tenancy;

/// <summary>
/// Scoped holder for the tenant resolved by the request middleware.
/// </summary>
public class TenantContext : ITenantService, ITenantContextSetter
{
    public Guid? TenantId { get; private set; }
    public string? Subdomain { get; private set; }
    public Tenant? Tenant { get; private set; }
    public bool HasTenant => Tenant is not null;

    public void SetTenant(Tenant tenant)
    {
        Tenant = tenant;
        TenantId = tenant.Id;
        Subdomain = tenant.Subdomain;
    }
}
