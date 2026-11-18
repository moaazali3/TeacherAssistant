namespace TeacherAssistant.Application.Common.Interfaces;

/// <summary>
/// Used by the tenant resolution middleware to attach the resolved tenant
/// to the current scope. Business code should depend on <see cref="ITenantService"/>.
/// </summary>
public interface ITenantContextSetter
{
    void SetTenant(Domain.Entities.Tenant tenant);
}
