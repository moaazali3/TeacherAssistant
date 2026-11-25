using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Quizzes;

public class QuizQuestionDto
{
    public string Id { get; set; } = string.Empty;

    [Required(ErrorMessage = "نص السؤال مطلوب.")]
    [StringLength(1000, MinimumLength = 2)]
    public string Prompt { get; set; } = string.Empty;

    [Required]
    public List<string> Options { get; set; } = new();

    /// <summary>Zero-based index of the correct option. Stripped (null) for students before submission.</summary>
    public int? CorrectOptionIndex { get; set; }

    public decimal Points { get; set; } = 1;
}

public class CreateQuizDto
{
    [Required(ErrorMessage = "عنوان الواجب أو الامتحان مطلوب.")]
    [StringLength(250, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    public Guid? LessonId { get; set; }

    public AssessmentType Type { get; set; } = AssessmentType.Homework;

    public int? DurationMinutes { get; set; }

    [Range(0, 100)]
    public int PassingScorePercent { get; set; } = 50;

    public bool IsPublished { get; set; } = true;

    [Required]
    public List<QuizQuestionDto> Questions { get; set; } = new();
}

public class StudentQuizSubmissionSummaryDto
{
    public Guid SubmissionId { get; set; }
    public decimal? Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal? Percentage { get; set; }
    public bool Passed { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public Dictionary<string, int>? Answers { get; set; }
}

public class QuizSummaryItemDto
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public Guid? LessonId { get; set; }
    public string? LessonTitle { get; set; }
    public string Title { get; set; } = string.Empty;
    public AssessmentType Type { get; set; }
    public int? DurationMinutes { get; set; }
    public int PassingScorePercent { get; set; }
    public bool IsPublished { get; set; }
    public int QuestionsCount { get; set; }
    public decimal TotalScore { get; set; }
    public int SubmissionsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public StudentQuizSubmissionSummaryDto? MySubmission { get; set; }
}

public class QuizDetailDto : QuizSummaryItemDto
{
    public List<QuizQuestionDto> Questions { get; set; } = new();
}

public class SubmitQuizAnswersDto
{
    [Required]
    public Dictionary<string, int> Answers { get; set; } = new();
}
