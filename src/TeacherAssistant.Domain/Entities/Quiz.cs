using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

public class Quiz : BaseEntity
{
    public Guid CourseId { get; set; }
    public Course? Course { get; set; }

    public Guid? LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    public string Title { get; set; } = string.Empty;
    public string QuestionsData { get; set; } = string.Empty; // JSON structure for questions & choices
    public decimal TotalScore { get; set; }

    // Navigation properties
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
