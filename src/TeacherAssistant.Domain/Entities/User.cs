using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class User : BaseEntity, ITenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;

    // Null for platform-level Admin users; set for every tenant user.
    public Guid? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Navigation properties
    public ICollection<Subject> InstructedSubjects { get; set; } = new List<Subject>();
    public ICollection<GroupMembership> GroupMemberships { get; set; } = new List<GroupMembership>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
