using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Subjects;

/// <summary>Full lesson, including the external ContentUrl.</summary>
public class LessonDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ContentType ContentType { get; set; }
    public string ContentUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
}
