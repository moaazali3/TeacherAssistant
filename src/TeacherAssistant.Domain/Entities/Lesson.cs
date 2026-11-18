using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class Lesson : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ContentType ContentType { get; set; } = ContentType.Video;

    // Lessons always point to an external resource (YouTube, Drive, article, ...).
    public string ContentUrl { get; set; } = string.Empty;

    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }

    // Navigation properties
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
