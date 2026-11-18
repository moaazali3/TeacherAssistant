using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;

namespace TeacherAssistant.Application.DTOs.Subjects;

public class CreateSubjectDto
{
    [Required, StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [HttpUrl, StringLength(500)]
    public string? ThumbnailUrl { get; set; }

    public bool IsPublished { get; set; }
}
