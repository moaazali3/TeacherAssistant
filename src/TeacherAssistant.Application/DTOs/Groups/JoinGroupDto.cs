using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.DTOs.Groups;

public class JoinGroupDto
{
    [Required, StringLength(8, MinimumLength = 8)]
    public string Code { get; set; } = string.Empty;
}
