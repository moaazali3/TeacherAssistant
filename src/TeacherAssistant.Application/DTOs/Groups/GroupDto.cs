namespace TeacherAssistant.Application.DTOs.Groups;

public class GroupDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectTitle { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ScheduleText { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public bool IsCodeActive { get; set; }
    public bool IsOpen { get; set; }
    public int StudentsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
