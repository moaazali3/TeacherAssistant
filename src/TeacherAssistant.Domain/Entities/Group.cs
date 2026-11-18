using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

/// <summary>
/// A teaching group inside a subject (for example "Saturday 5pm").
/// Students join a group with its join code, which places them in the subject.
/// </summary>
public class Group : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? ScheduleText { get; set; }

    /// <summary>8 characters, uppercase letters/digits without 0/O/1/I. Unique per tenant.</summary>
    public string JoinCode { get; set; } = string.Empty;

    public bool IsCodeActive { get; set; } = true;
    public bool IsOpen { get; set; } = true;

    // Navigation properties
    public ICollection<GroupMembership> Memberships { get; set; } = new List<GroupMembership>();
}
