using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Application.Common.Validation;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Subjects;

public class UpdateLessonDto
{
    [Required, StringLength(200, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [EnumDataType(typeof(ContentType))]
    public ContentType ContentType { get; set; } = ContentType.Video;

    [Required, HttpUrl, StringLength(500)]
    public string ContentUrl { get; set; } = string.Empty;

    public bool IsPublished { get; set; }
}
