using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class Lesson : BaseEntity
{
    public Guid CourseId { get; set; }
    public Course? Course { get; set; }

    public string Title { get; set; } = string.Empty;
    public ContentType ContentType { get; set; } = ContentType.Video;
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }

    // Navigation properties
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
