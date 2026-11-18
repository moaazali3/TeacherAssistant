namespace TeacherAssistant.Domain.Common;

/// <summary>
/// Marks an entity that belongs to a tenant. The TenantId is applied automatically
/// by the persistence layer, so business code normally never sets it.
/// </summary>
public interface ITenantEntity
{
    Guid? TenantId { get; set; }
}
