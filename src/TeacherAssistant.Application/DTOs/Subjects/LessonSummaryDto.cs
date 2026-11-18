using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Subjects;

public class LessonSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ContentType ContentType { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
}
