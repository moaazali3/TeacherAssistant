namespace TeacherAssistant.Application.DTOs.Subjects;

public class SubjectDetailDto
{
    public Guid Id { get; set; }
    public Guid InstructorId { get; set; }
    public string InstructorName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Lesson summaries only. ContentUrl is intentionally absent here.</summary>
    public List<LessonSummaryDto> Lessons { get; set; } = new();
}
