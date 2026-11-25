using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Students;

public class StudentSummaryDto
{
    public Guid StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ParentPhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public List<string> Groups { get; set; } = new();
    public int CompletedQuizzesCount { get; set; }
    public int TotalQuizzesCount { get; set; }
    public decimal? AverageScorePercentage { get; set; }
    public DateTime? LastSubmissionAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StudentGroupSummaryDto
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string SubjectTitle { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

public class StudentSubmissionItemDto
{
    public Guid QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public string SubjectTitle { get; set; } = string.Empty;
    public decimal? Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal? Percentage { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
}

public class PendingQuizItemDto
{
    public Guid QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public string SubjectTitle { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
}

public class StudentProgressDto
{
    public Guid StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ParentPhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalQuizzesAvailable { get; set; }
    public int CompletedQuizzes { get; set; }
    public int PendingQuizzesCount { get; set; }
    public int TotalLessonsAvailable { get; set; }
    public int CompletedLessonsCount { get; set; }
    public decimal? AverageScorePercentage { get; set; }
    public DateTime? LastSubmissionAt { get; set; }
    public List<StudentGroupSummaryDto> Groups { get; set; } = new();
    public List<StudentSubmissionItemDto> CompletedSubmissions { get; set; } = new();
    public List<PendingQuizItemDto> PendingQuizzes { get; set; } = new();
}
