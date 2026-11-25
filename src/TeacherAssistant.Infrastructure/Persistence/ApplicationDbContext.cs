using System.Reflection;
using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantService _tenantService;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMembership> GroupMemberships => Set<GroupMembership>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Submission> Submissions => Set<Submission>();

    private Guid? CurrentTenantId => _tenantService.TenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        ApplyTenantIsolation(modelBuilder);
    }

    public override int SaveChanges()
    {
        ApplyTenantIdToAddedEntities();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTenantIdToAddedEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Adds a global query filter and an index for every tenant-owned entity.
    /// Platform-level requests (no resolved tenant) are not filtered so that
    /// platform admins can work across tenants.
    /// </summary>
    private void ApplyTenantIsolation(ModelBuilder modelBuilder)
    {
        var method = typeof(ApplicationDbContext)
            .GetMethod(nameof(ConfigureTenantEntity), BindingFlags.Instance | BindingFlags.NonPublic)!;

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.IsOwned() || !typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            method.MakeGenericMethod(entityType.ClrType).Invoke(this, new object[] { modelBuilder });
        }
    }

    private void ConfigureTenantEntity<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantEntity
    {
        modelBuilder.Entity<TEntity>()
            .HasIndex(e => e.TenantId);

        modelBuilder.Entity<TEntity>()
            .HasQueryFilter(e => CurrentTenantId == null || e.TenantId == CurrentTenantId);
    }

    /// <summary>
    /// Stamps the current tenant on newly added tenant-owned entities and blocks
    /// accidental cross-tenant inserts.
    /// </summary>
    private void ApplyTenantIdToAddedEntities()
    {
        var currentTenantId = _tenantService.TenantId;
        if (currentTenantId is null) return;

        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State != EntityState.Added) continue;

            if (entry.Entity.TenantId is null)
            {
                entry.Entity.TenantId = currentTenantId;
            }
            else if (entry.Entity.TenantId != currentTenantId)
            {
                throw new InvalidOperationException("Cannot persist an entity that belongs to another tenant.");
            }
        }
    }
}
