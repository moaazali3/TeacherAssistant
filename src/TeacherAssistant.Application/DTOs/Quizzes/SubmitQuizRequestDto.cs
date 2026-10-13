namespace TeacherAssistant.Application.DTOs.Quizzes;

public class SubmitQuizRequestDto
{
    public string AnswersData { get; set; } = string.Empty; // JSON structure representing student's submitted choices
}
