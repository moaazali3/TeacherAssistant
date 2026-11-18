using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.DTOs.Groups;

public class CreateGroupDto
{
    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ScheduleText { get; set; }

    /// <summary>When false the group does not accept joins by code yet. Defaults to true.</summary>
    public bool IsOpen { get; set; } = true;
}
