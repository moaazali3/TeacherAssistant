using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

/// <summary>
/// A subject (for example "Chemistry") owned by one instructor.
/// </summary>
public class Subject : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid InstructorId { get; set; }
    public User? Instructor { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }

    // Navigation properties
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Group> Groups { get; set; } = new List<Group>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
