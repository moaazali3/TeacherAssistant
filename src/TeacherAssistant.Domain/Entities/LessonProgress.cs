using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

public class LessonProgress : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid StudentId { get; set; }
    public User? Student { get; set; }

    public Guid LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ViewCount { get; set; }
    public DateTime LastViewedAt { get; set; } = DateTime.UtcNow;
}
