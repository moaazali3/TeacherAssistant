using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class Enrollment : BaseEntity
{
    public Guid StudentId { get; set; }
    public User? Student { get; set; }

    public Guid CourseId { get; set; }
    public Course? Course { get; set; }

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
}
