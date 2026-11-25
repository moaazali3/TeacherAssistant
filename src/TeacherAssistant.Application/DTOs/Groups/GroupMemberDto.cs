using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Groups;

public class GroupMemberDto
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ParentPhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public DateTime JoinedAt { get; set; }
}
