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
    public decimal Price { get; set; }
    public bool IsPurchased { get; set; }
    public string? ModuleTitle { get; set; }
    public DateTime? AvailableAt { get; set; }
    public bool RequiresPreviousCompletion { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool IsCompleted { get; set; }
    public int ViewCount { get; set; }
}
