using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.DTOs.Groups;

public class MoveStudentDto
{
    [Required]
    public Guid TargetGroupId { get; set; }
}
