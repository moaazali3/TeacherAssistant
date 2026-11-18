using System.ComponentModel.DataAnnotations;

namespace TeacherAssistant.Application.DTOs.Subjects;

/// <summary>The full list of lesson ids for a subject, in the desired order.</summary>
public class ReorderLessonsDto
{
    [Required]
    public List<Guid> LessonIds { get; set; } = new();
}
