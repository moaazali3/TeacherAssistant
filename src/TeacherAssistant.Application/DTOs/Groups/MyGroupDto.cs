namespace TeacherAssistant.Application.DTOs.Groups;

public class MyGroupDto
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? ScheduleText { get; set; }
    public Guid SubjectId { get; set; }
    public string SubjectTitle { get; set; } = string.Empty;
    public string InstructorName { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}
