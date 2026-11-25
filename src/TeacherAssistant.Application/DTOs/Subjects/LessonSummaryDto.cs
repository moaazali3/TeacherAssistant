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
    public string? ModuleTitle { get; set; }
    public DateTime? AvailableAt { get; set; }
    public bool RequiresPreviousCompletion { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool IsLocked { get; set; }
    public string? LockReason { get; set; }
    public bool IsCompleted { get; set; }
    public int ViewCount { get; set; }
}
