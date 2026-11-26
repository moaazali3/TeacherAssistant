using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Quizzes;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Quizzes;

public class QuizService : IQuizService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;

    public QuizService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITenantService tenantService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tenantService = tenantService;
    }

    public async Task<ServiceResult<IReadOnlyList<QuizSummaryItemDto>>> GetSubjectQuizzesAsync(
        Guid subjectId,
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<IReadOnlyList<QuizSummaryItemDto>>();

        if (_currentUserService.UserId is not { } userId || !_currentUserService.IsAuthenticated)
            return ServiceResult<IReadOnlyList<QuizSummaryItemDto>>.Forbidden();

        var subject = await _context.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<IReadOnlyList<QuizSummaryItemDto>>.NotFound("Subject not found.");

        var isStaff = CanStaffReadSubject(subject.InstructorId);
        if (!isStaff)
        {
            if (!IsStudent || !subject.IsPublished || !await IsMemberAsync(subjectId, userId, cancellationToken))
                return ServiceResult<IReadOnlyList<QuizSummaryItemDto>>.NotFound("Subject not found.");
        }

        var quizQuery = _context.Quizzes
            .AsNoTracking()
            .Include(q => q.Lesson)
            .Include(q => q.Submissions)
            .Where(q => q.SubjectId == subjectId);

        if (!isStaff)
            quizQuery = quizQuery.Where(q => q.IsPublished);

        var quizzes = await quizQuery
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = quizzes
            .Select(q => MapSummaryItem(q, isStaff ? null : userId))
            .ToList();

        return ServiceResult<IReadOnlyList<QuizSummaryItemDto>>.Ok(result, "Quizzes fetched successfully.");
    }

    public async Task<ServiceResult<QuizDetailDto>> GetQuizDetailAsync(
        Guid quizId,
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<QuizDetailDto>();

        if (_currentUserService.UserId is not { } userId || !_currentUserService.IsAuthenticated)
            return ServiceResult<QuizDetailDto>.Forbidden();

        var quiz = await _context.Quizzes
            .AsNoTracking()
            .Include(q => q.Subject)
            .Include(q => q.Lesson)
            .Include(q => q.Submissions)
            .FirstOrDefaultAsync(q => q.Id == quizId, cancellationToken);

        if (quiz is null || quiz.Subject is null)
            return ServiceResult<QuizDetailDto>.NotFound("Quiz not found.");

        var isStaff = CanStaffReadSubject(quiz.Subject.InstructorId);
        if (!isStaff)
        {
            if (!IsStudent || !quiz.Subject.IsPublished || !quiz.IsPublished ||
                !await IsMemberAsync(quiz.SubjectId, userId, cancellationToken))
            {
                return ServiceResult<QuizDetailDto>.NotFound("Quiz not found.");
            }
        }

        var studentId = isStaff ? (Guid?)null : userId;
        var summary = MapSummaryItem(quiz, studentId);
        var questions = DeserializeQuestions(quiz.QuestionsData);

        var hideAnswerKey = !isStaff && summary.MySubmission is null;
        if (hideAnswerKey)
        {
            if (quiz.AvailableFrom.HasValue && quiz.AvailableFrom.Value > DateTime.UtcNow)
            {
                return ServiceResult<QuizDetailDto>.Forbidden("لم يحن موعد فتح هذا التقييم بعد.");
            }

            questions = questions.Select(q => new QuizQuestionDto
            {
                Id = q.Id,
                Prompt = q.Prompt,
                Options = q.Options,
                CorrectOptionIndex = null,
                Points = q.Points
            }).ToList();
        }

        var detail = new QuizDetailDto
        {
            Id = summary.Id,
            SubjectId = summary.SubjectId,
            LessonId = summary.LessonId,
            LessonTitle = summary.LessonTitle,
            Title = summary.Title,
            Type = summary.Type,
            Placement = summary.Placement,
            AvailableFrom = summary.AvailableFrom,
            DueAt = summary.DueAt,
            DurationMinutes = summary.DurationMinutes,
            PassingScorePercent = summary.PassingScorePercent,
            IsPublished = summary.IsPublished,
            QuestionsCount = summary.QuestionsCount,
            TotalScore = summary.TotalScore,
            SubmissionsCount = summary.SubmissionsCount,
            CreatedAt = summary.CreatedAt,
            MySubmission = summary.MySubmission,
            Questions = questions
        };

        return ServiceResult<QuizDetailDto>.Ok(detail, "Quiz fetched successfully.");
    }

    public async Task<ServiceResult<QuizDetailDto>> CreateQuizAsync(
        Guid subjectId,
        CreateQuizDto request,
        CancellationToken cancellationToken = default)
    {
        if (!CanManageAssessments(out var instructorId))
            return ServiceResult<QuizDetailDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<QuizDetailDto>();

        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<QuizDetailDto>.NotFound("Subject not found.");

        if (instructorId is not null && subject.InstructorId != instructorId.Value)
            return ServiceResult<QuizDetailDto>.Forbidden("You can only add assessments to your own subjects.");

        if (request.DurationMinutes is < 1 or > 300)
            return ServiceResult<QuizDetailDto>.BadRequest("مدة الامتحان يجب أن تكون بين 1 و 300 دقيقة.");

        if (request.Questions is null || request.Questions.Count == 0)
            return ServiceResult<QuizDetailDto>.BadRequest("يجب إضافة سؤال واحد على الأقل.");

        string? lessonTitle = null;
        if (request.LessonId.HasValue)
        {
            var lesson = await _context.Lessons
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == request.LessonId.Value && l.SubjectId == subjectId, cancellationToken);

            if (lesson is null)
                return ServiceResult<QuizDetailDto>.BadRequest("الدرس المحدد لا ينتمي لهذه المادة.");

            lessonTitle = lesson.Title;
        }

        var normalizedQuestions = new List<QuizQuestionDto>(request.Questions.Count);
        foreach (var q in request.Questions)
        {
            var prompt = q.Prompt?.Trim() ?? string.Empty;
            if (prompt.Length < 2)
                return ServiceResult<QuizDetailDto>.BadRequest("كل سؤال يجب أن يحتوي على نص واضح.");

            var cleanOptions = q.Options?
                .Select(o => o?.Trim() ?? string.Empty)
                .Where(o => !string.IsNullOrEmpty(o))
                .ToList() ?? new List<string>();

            if (cleanOptions.Count < 2)
                return ServiceResult<QuizDetailDto>.BadRequest("كل سؤال يجب أن يحتوي على خيارين على الأقل.");

            if (q.CorrectOptionIndex is null || q.CorrectOptionIndex < 0 || q.CorrectOptionIndex >= cleanOptions.Count)
                return ServiceResult<QuizDetailDto>.BadRequest("يرجى تحديد الإجابة الصحيحة لكل سؤال.");

            var points = q.Points <= 0 ? 1 : q.Points;
            normalizedQuestions.Add(new QuizQuestionDto
            {
                Id = string.IsNullOrWhiteSpace(q.Id) ? Guid.NewGuid().ToString("N")[..8] : q.Id.Trim(),
                Prompt = prompt,
                Options = cleanOptions,
                CorrectOptionIndex = q.CorrectOptionIndex,
                Points = points
            });
        }

        var availableFrom = NormalizeUtc(request.AvailableFrom);
        var dueAt = NormalizeUtc(request.DueAt);
        if (availableFrom.HasValue && dueAt.HasValue && dueAt.Value <= availableFrom.Value)
            return ServiceResult<QuizDetailDto>.BadRequest("الموعد النهائي (الديدلاين) يجب أن يكون بعد موعد الفتح.");

        var placement = request.LessonId is null
            ? AssessmentPlacement.General
            : (request.Placement == AssessmentPlacement.General ? AssessmentPlacement.AfterLesson : request.Placement);

        var totalScore = normalizedQuestions.Sum(q => q.Points);

        var quiz = new Quiz
        {
            SubjectId = subjectId,
            LessonId = request.LessonId,
            Title = request.Title.Trim(),
            Type = request.Type,
            Placement = placement,
            AvailableFrom = availableFrom,
            DueAt = dueAt,
            DurationMinutes = request.DurationMinutes,
            PassingScorePercent = request.PassingScorePercent,
            IsPublished = request.IsPublished,
            QuestionsData = JsonSerializer.Serialize(normalizedQuestions, JsonOptions),
            TotalScore = totalScore
        };

        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<QuizDetailDto>.Created(new QuizDetailDto
        {
            Id = quiz.Id,
            SubjectId = quiz.SubjectId,
            LessonId = quiz.LessonId,
            LessonTitle = lessonTitle,
            Title = quiz.Title,
            Type = quiz.Type,
            Placement = quiz.Placement,
            AvailableFrom = quiz.AvailableFrom,
            DueAt = quiz.DueAt,
            DurationMinutes = quiz.DurationMinutes,
            PassingScorePercent = quiz.PassingScorePercent,
            IsPublished = quiz.IsPublished,
            QuestionsCount = normalizedQuestions.Count,
            TotalScore = quiz.TotalScore,
            SubmissionsCount = 0,
            CreatedAt = quiz.CreatedAt,
            Questions = normalizedQuestions
        }, "Quiz created successfully.");
    }

    public async Task<ServiceResult<string>> DeleteQuizAsync(
        Guid quizId,
        CancellationToken cancellationToken = default)
    {
        if (!CanManageAssessments(out var instructorId))
            return ServiceResult<string>.Forbidden();

        if (!HasTenant)
            return NoTenant<string>();

        var quiz = await _context.Quizzes
            .Include(q => q.Subject)
            .FirstOrDefaultAsync(q => q.Id == quizId, cancellationToken);

        if (quiz is null)
            return ServiceResult<string>.NotFound("Quiz not found.");

        if (instructorId is not null && (quiz.Subject is null || quiz.Subject.InstructorId != instructorId.Value))
            return ServiceResult<string>.Forbidden("You can only delete assessments of your own subjects.");

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(quizId.ToString(), "Quiz deleted successfully.");
    }

    public async Task<ServiceResult<StudentQuizSubmissionSummaryDto>> SubmitQuizAnswersAsync(
        Guid quizId,
        SubmitQuizAnswersDto request,
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<StudentQuizSubmissionSummaryDto>();

        if (_currentUserService.UserId is not { } studentId || !IsStudent)
            return ServiceResult<StudentQuizSubmissionSummaryDto>.Forbidden("Only students can submit quizzes.");

        var quiz = await _context.Quizzes
            .AsNoTracking()
            .Include(q => q.Subject)
            .FirstOrDefaultAsync(q => q.Id == quizId, cancellationToken);

        if (quiz is null || quiz.Subject is null || !quiz.Subject.IsPublished || !quiz.IsPublished ||
            !await IsMemberAsync(quiz.SubjectId, studentId, cancellationToken))
        {
            return ServiceResult<StudentQuizSubmissionSummaryDto>.NotFound("Quiz not found.");
        }

        var now = DateTime.UtcNow;
        if (quiz.AvailableFrom.HasValue && quiz.AvailableFrom.Value > now)
        {
            return ServiceResult<StudentQuizSubmissionSummaryDto>.Forbidden(
                "لم يحن موعد فتح هذا التقييم بعد.");
        }

        if (quiz.DueAt.HasValue && quiz.DueAt.Value < now)
        {
            return ServiceResult<StudentQuizSubmissionSummaryDto>.Forbidden(
                "انتهى الموعد النهائي (الديدلاين) لتسليم هذا التقييم.");
        }

        var existing = await _context.Submissions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.QuizId == quizId && s.StudentId == studentId, cancellationToken);

        if (existing is not null)
        {
            return ServiceResult<StudentQuizSubmissionSummaryDto>.Conflict(
                "تم تسليم هذا التقييم بالفعل ولا يمكن إعادة التسليم.");
        }

        var questions = DeserializeQuestions(quiz.QuestionsData);
        var answers = request.Answers ?? new Dictionary<string, int>();

        decimal earnedScore = 0;
        foreach (var q in questions)
        {
            if (answers.TryGetValue(q.Id, out var chosenIndex) &&
                q.CorrectOptionIndex.HasValue &&
                chosenIndex == q.CorrectOptionIndex.Value)
            {
                earnedScore += q.Points;
            }
        }

        var totalScore = quiz.TotalScore > 0 ? quiz.TotalScore : questions.Sum(q => q.Points);
        var percentage = totalScore > 0 ? Math.Round(earnedScore / totalScore * 100m, 1) : 0m;
        var passed = percentage >= quiz.PassingScorePercent;

        var feedback = passed
            ? $"أحسنت! اجتزت التقييم بنسبة {percentage}%."
            : $"تم التسليم بنسبة {percentage}% (نسبة النجاح المطلوبة {quiz.PassingScorePercent}%).";

        var submission = new Submission
        {
            QuizId = quizId,
            StudentId = studentId,
            Score = earnedScore,
            AnswersData = JsonSerializer.Serialize(answers, JsonOptions),
            Feedback = feedback,
            SubmittedAt = DateTime.UtcNow
        };

        _context.Submissions.Add(submission);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<StudentQuizSubmissionSummaryDto>.Ok(new StudentQuizSubmissionSummaryDto
        {
            SubmissionId = submission.Id,
            Score = earnedScore,
            TotalScore = totalScore,
            Percentage = percentage,
            Passed = passed,
            Feedback = feedback,
            SubmittedAt = submission.SubmittedAt,
            Answers = answers
        }, "Quiz submitted and graded successfully.");
    }

    private QuizSummaryItemDto MapSummaryItem(Quiz quiz, Guid? studentId)
    {
        var questions = DeserializeQuestions(quiz.QuestionsData);
        StudentQuizSubmissionSummaryDto? mySubDto = null;

        if (studentId.HasValue)
        {
            var mySub = quiz.Submissions.FirstOrDefault(s => s.StudentId == studentId.Value);
            if (mySub is not null)
            {
                var pct = mySub.Score.HasValue && quiz.TotalScore > 0
                    ? Math.Round(mySub.Score.Value / quiz.TotalScore * 100m, 1)
                    : (decimal?)null;

                mySubDto = new StudentQuizSubmissionSummaryDto
                {
                    SubmissionId = mySub.Id,
                    Score = mySub.Score,
                    TotalScore = quiz.TotalScore,
                    Percentage = pct,
                    Passed = pct.HasValue && pct.Value >= quiz.PassingScorePercent,
                    Feedback = mySub.Feedback,
                    SubmittedAt = mySub.SubmittedAt,
                    Answers = DeserializeAnswers(mySub.AnswersData)
                };
            }
        }

        return new QuizSummaryItemDto
        {
            Id = quiz.Id,
            SubjectId = quiz.SubjectId,
            LessonId = quiz.LessonId,
            LessonTitle = quiz.Lesson?.Title,
            Title = quiz.Title,
            Type = quiz.Type,
            Placement = quiz.Placement,
            AvailableFrom = quiz.AvailableFrom,
            DueAt = quiz.DueAt,
            DurationMinutes = quiz.DurationMinutes,
            PassingScorePercent = quiz.PassingScorePercent,
            IsPublished = quiz.IsPublished,
            QuestionsCount = questions.Count,
            TotalScore = quiz.TotalScore,
            SubmissionsCount = quiz.Submissions.Count,
            CreatedAt = quiz.CreatedAt,
            MySubmission = mySubDto
        };
    }

    private static List<QuizQuestionDto> DeserializeQuestions(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<QuizQuestionDto>();
        try
        {
            return JsonSerializer.Deserialize<List<QuizQuestionDto>>(json, JsonOptions) ?? new List<QuizQuestionDto>();
        }
        catch
        {
            return new List<QuizQuestionDto>();
        }
    }

    private static Dictionary<string, int>? DeserializeAnswers(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, int>>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private bool HasTenant => _tenantService.HasTenant && _tenantService.TenantId is not null;

    private bool IsStudent => string.Equals(
        _currentUserService.Role, nameof(UserRole.Student), StringComparison.Ordinal);

    private Task<bool> IsMemberAsync(Guid subjectId, Guid studentId, CancellationToken cancellationToken)
        => _context.GroupMemberships
            .AnyAsync(m => m.SubjectId == subjectId && m.StudentId == studentId, cancellationToken);

    private bool CanStaffReadSubject(Guid subjectInstructorId)
    {
        if (_currentUserService.UserId is not { } userId || userId == Guid.Empty)
            return false;

        if (string.Equals(_currentUserService.Role, nameof(UserRole.Instructor), StringComparison.Ordinal))
            return subjectInstructorId == userId;

        return string.Equals(_currentUserService.Role, nameof(UserRole.Assistant), StringComparison.Ordinal)
            && (_currentUserService.HasPermission(AssistantPermissions.ViewStudentProgress)
                || _currentUserService.HasPermission(AssistantPermissions.ManageAssessments));
    }

    private bool CanManageAssessments(out Guid? instructorId)
    {
        var userId = _currentUserService.UserId ?? Guid.Empty;
        if (userId != Guid.Empty &&
            string.Equals(_currentUserService.Role, nameof(UserRole.Instructor), StringComparison.Ordinal))
        {
            instructorId = userId;
            return true;
        }

        instructorId = null;
        return userId != Guid.Empty
            && string.Equals(_currentUserService.Role, nameof(UserRole.Assistant), StringComparison.Ordinal)
            && _currentUserService.HasPermission(AssistantPermissions.ManageAssessments);
    }

    private static DateTime? NormalizeUtc(DateTime? dt)
        => dt is null ? null : (dt.Value.Kind == DateTimeKind.Utc ? dt.Value : dt.Value.ToUniversalTime());

    private static ServiceResult<T> NoTenant<T>()
        => ServiceResult<T>.NotFound("No tenant was resolved for this request.");
}
