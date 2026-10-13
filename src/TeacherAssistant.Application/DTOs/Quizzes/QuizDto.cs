namespace TeacherAssistant.Application.DTOs.Quizzes;

public class QuizDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid? LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string QuestionsData { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public DateTime CreatedAt { get; set; }
}
