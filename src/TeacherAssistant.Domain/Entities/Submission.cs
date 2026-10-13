using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

public class Submission : BaseEntity
{
    public Guid QuizId { get; set; }
    public Quiz? Quiz { get; set; }

    public Guid StudentId { get; set; }
    public User? Student { get; set; }

    public decimal? Score { get; set; }
    public string AnswersData { get; set; } = string.Empty; // JSON structure for student answers
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
