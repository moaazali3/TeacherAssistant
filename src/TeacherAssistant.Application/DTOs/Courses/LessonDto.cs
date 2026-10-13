using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Courses;

public class LessonDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public ContentType ContentType { get; set; }
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }
}
