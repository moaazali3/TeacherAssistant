using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

/// <summary>
/// Places a student in one group of a subject. The unique index on
/// (StudentId, SubjectId) guarantees one group per subject per student.
/// </summary>
public class GroupMembership : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid GroupId { get; set; }
    public Group? Group { get; set; }

    /// <summary>Denormalized subject id; no FK on purpose to keep cascade paths simple.</summary>
    public Guid SubjectId { get; set; }

    public Guid StudentId { get; set; }
    public User? Student { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
