namespace TeacherAssistant.Application.DTOs.Subjects;

public class SubjectSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }
    public int LessonsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
