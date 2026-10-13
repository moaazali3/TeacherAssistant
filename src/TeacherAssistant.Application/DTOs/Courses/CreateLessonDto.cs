using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Courses;

public class CreateLessonDto
{
    public string Title { get; set; } = string.Empty;
    public ContentType ContentType { get; set; } = ContentType.Video;
    public string? VideoUrl { get; set; }
    public string? AttachmentUrl { get; set; }
}
