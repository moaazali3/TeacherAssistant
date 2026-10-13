using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;

    // Optional Tenancy identifier for instructors / centers
    public string? TenantId { get; set; }

    // Navigation properties
    public ICollection<Course> InstructedCourses { get; set; } = new List<Course>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
