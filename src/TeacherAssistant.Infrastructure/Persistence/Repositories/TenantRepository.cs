using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly IApplicationDbContext _context;

    public TenantRepository(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Tenant?> GetBySubdomainAsync(string subdomain, CancellationToken cancellationToken = default)
        => _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Subdomain == subdomain, cancellationToken);

    public Task<Tenant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public Task<bool> SubdomainExistsAsync(string subdomain, CancellationToken cancellationToken = default)
        => _context.Tenants.AnyAsync(t => t.Subdomain == subdomain, cancellationToken);
}
