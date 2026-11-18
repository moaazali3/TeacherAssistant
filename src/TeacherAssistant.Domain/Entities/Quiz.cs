using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

public class Quiz : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public Guid? LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    public string Title { get; set; } = string.Empty;
    public string QuestionsData { get; set; } = string.Empty; // JSON structure for questions & choices
    public decimal TotalScore { get; set; }

    // Navigation properties
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
