namespace TeacherAssistant.Application.DTOs.Quizzes;

public class GenerateQuizRequestDto
{
    public Guid CourseId { get; set; }
    public Guid? LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int NumberOfQuestions { get; set; } = 5;
    public string DifficultyLevel { get; set; } = "Medium"; // Easy, Medium, Hard
    public Stream? FileStream { get; set; }
    public string? FileName { get; set; }
}
