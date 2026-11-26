using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class Quiz : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public Guid? LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    public string Title { get; set; } = string.Empty;
    public AssessmentType Type { get; set; } = AssessmentType.Homework;
    public AssessmentPlacement Placement { get; set; } = AssessmentPlacement.AfterLesson;
    public DateTime? AvailableFrom { get; set; }
    public DateTime? DueAt { get; set; }
    public int? DurationMinutes { get; set; }
    public int PassingScorePercent { get; set; } = 50;
    public bool IsPublished { get; set; } = true;
    public string QuestionsData { get; set; } = string.Empty; // JSON structure for questions & choices
    public decimal TotalScore { get; set; }

    // Navigation properties
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
