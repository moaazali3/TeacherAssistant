namespace TeacherAssistant.Application.DTOs.Quizzes;

public class SubmissionResultDto
{
    public Guid SubmissionId { get; set; }
    public Guid QuizId { get; set; }
    public Guid StudentId { get; set; }
    public decimal Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal Percentage => TotalScore > 0 ? (Score / TotalScore) * 100 : 0;
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
}
