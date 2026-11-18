using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.DTOs.Groups;

public class UpdateGroupDto
{
    [Required, StringLength(150, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ScheduleText { get; set; }

    public bool IsOpen { get; set; } = true;
}
