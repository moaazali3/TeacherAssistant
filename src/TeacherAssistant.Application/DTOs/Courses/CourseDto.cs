namespace TeacherAssistant.Application.DTOs.Courses;

public class CourseDto
{
    public Guid Id { get; set; }
    public Guid InstructorId { get; set; }
    public string InstructorName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<LessonDto> Lessons { get; set; } = new();
}
