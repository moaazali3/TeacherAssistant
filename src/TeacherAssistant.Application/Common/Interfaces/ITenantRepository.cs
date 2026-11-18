using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Application.Common.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetBySubdomainAsync(string subdomain, CancellationToken cancellationToken = default);
    Task<Tenant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> SubdomainExistsAsync(string subdomain, CancellationToken cancellationToken = default);
}
