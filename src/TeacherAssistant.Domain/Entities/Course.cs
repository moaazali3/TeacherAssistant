using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

public class Course : BaseEntity
{
    public Guid InstructorId { get; set; }
    public User? Instructor { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ThumbnailUrl { get; set; }

    // Navigation properties
    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
