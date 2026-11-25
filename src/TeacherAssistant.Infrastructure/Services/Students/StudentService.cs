using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Students;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Students;

public class StudentService : IStudentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;
    private readonly IPasswordHasher _passwordHasher;

    public StudentService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITenantService tenantService,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tenantService = tenantService;
        _passwordHasher = passwordHasher;
    }

    public async Task<ServiceResult<IReadOnlyList<StudentSummaryDto>>> GetStudentsAsync(
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.HasPermission(AssistantPermissions.ViewStudentProgress))
            return ServiceResult<IReadOnlyList<StudentSummaryDto>>.Forbidden();

        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<IReadOnlyList<StudentSummaryDto>>.NotFound("No tenant was resolved for this request.");

        var query = _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Student);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(term)) ||
                (u.ParentPhoneNumber != null && u.ParentPhoneNumber.Contains(term)));
        }

        var students = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.PhoneNumber,
                u.ParentPhoneNumber,
                u.DateOfBirth,
                u.Gender,
                u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var studentIds = students.Select(s => s.Id).ToList();

        var memberships = await _context.GroupMemberships
            .AsNoTracking()
            .Where(m => studentIds.Contains(m.StudentId))
            .Select(m => new
            {
                m.StudentId,
                m.SubjectId,
                GroupName = m.Group != null ? m.Group.Name : string.Empty
            })
            .ToListAsync(cancellationToken);

        var quizzes = await _context.Quizzes
            .AsNoTracking()
            .Select(q => new { q.Id, q.SubjectId, q.TotalScore })
            .ToListAsync(cancellationToken);

        var submissions = await _context.Submissions
            .AsNoTracking()
            .Where(s => studentIds.Contains(s.StudentId))
            .Select(s => new
            {
                s.StudentId,
                s.QuizId,
                s.Score,
                s.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        var quizLookup = quizzes.ToDictionary(q => q.Id);
        var membershipsByStudent = memberships.ToLookup(m => m.StudentId);
        var submissionsByStudent = submissions.ToLookup(s => s.StudentId);

        var summaries = students.Select(student =>
        {
            var studentMemberships = membershipsByStudent[student.Id].ToList();
            var enrolledSubjectIds = studentMemberships.Select(m => m.SubjectId).Distinct().ToHashSet();
            var availableQuizzesCount = quizzes.Count(q => enrolledSubjectIds.Contains(q.SubjectId));

            var studentSubs = submissionsByStudent[student.Id].ToList();
            var completedQuizIds = studentSubs.Select(s => s.QuizId).Distinct().Count();

            var scoredPercentages = studentSubs
                .Where(s => s.Score.HasValue && quizLookup.TryGetValue(s.QuizId, out var q) && q.TotalScore > 0)
                .Select(s => Math.Round(s.Score!.Value / quizLookup[s.QuizId].TotalScore * 100m, 1))
                .ToList();

            decimal? averagePct = scoredPercentages.Count > 0
                ? Math.Round(scoredPercentages.Average(), 1)
                : null;

            return new StudentSummaryDto
            {
                StudentId = student.Id,
                Name = student.Name,
                Email = student.Email,
                PhoneNumber = student.PhoneNumber,
                ParentPhoneNumber = student.ParentPhoneNumber,
                DateOfBirth = student.DateOfBirth,
                Gender = student.Gender,
                Groups = studentMemberships
                    .Select(m => m.GroupName)
                    .Where(g => !string.IsNullOrEmpty(g))
                    .Distinct()
                    .ToList(),
                CompletedQuizzesCount = completedQuizIds,
                TotalQuizzesCount = availableQuizzesCount,
                AverageScorePercentage = averagePct,
                LastSubmissionAt = studentSubs.Count > 0 ? studentSubs.Max(s => s.SubmittedAt) : null,
                CreatedAt = student.CreatedAt
            };
        }).ToList();

        return ServiceResult<IReadOnlyList<StudentSummaryDto>>.Ok(summaries, "Students fetched successfully.");
    }

    public async Task<ServiceResult<StudentProgressDto>> GetStudentProgressAsync(
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.HasPermission(AssistantPermissions.ViewStudentProgress))
            return ServiceResult<StudentProgressDto>.Forbidden();

        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<StudentProgressDto>.NotFound("No tenant was resolved for this request.");

        var student = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == UserRole.Student, cancellationToken);

        if (student is null)
            return ServiceResult<StudentProgressDto>.NotFound("Student not found in this tenant.");

        var memberships = await _context.GroupMemberships
            .AsNoTracking()
            .Where(m => m.StudentId == studentId)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new
            {
                m.GroupId,
                GroupName = m.Group != null ? m.Group.Name : string.Empty,
                m.SubjectId,
                SubjectTitle = m.Group != null && m.Group.Subject != null ? m.Group.Subject.Title : string.Empty,
                m.JoinedAt
            })
            .ToListAsync(cancellationToken);

        var subjectIds = memberships.Select(m => m.SubjectId).Distinct().ToHashSet();

        var subjectQuizzes = await _context.Quizzes
            .AsNoTracking()
            .Where(q => subjectIds.Contains(q.SubjectId))
            .Select(q => new
            {
                q.Id,
                q.Title,
                q.TotalScore,
                SubjectTitle = q.Subject != null ? q.Subject.Title : string.Empty
            })
            .ToListAsync(cancellationToken);

        var submissions = await _context.Submissions
            .AsNoTracking()
            .Where(s => s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new
            {
                s.QuizId,
                QuizTitle = s.Quiz != null ? s.Quiz.Title : string.Empty,
                SubjectTitle = s.Quiz != null && s.Quiz.Subject != null ? s.Quiz.Subject.Title : string.Empty,
                TotalScore = s.Quiz != null ? s.Quiz.TotalScore : 0m,
                s.Score,
                s.Feedback,
                s.SubmittedAt
            })
            .ToListAsync(cancellationToken);

        var completedItems = submissions.Select(s => new StudentSubmissionItemDto
        {
            QuizId = s.QuizId,
            QuizTitle = s.QuizTitle,
            SubjectTitle = s.SubjectTitle,
            Score = s.Score,
            TotalScore = s.TotalScore,
            Percentage = s.Score.HasValue && s.TotalScore > 0
                ? Math.Round(s.Score.Value / s.TotalScore * 100m, 1)
                : null,
            Feedback = s.Feedback,
            SubmittedAt = s.SubmittedAt
        }).ToList();

        var completedQuizIds = completedItems.Select(c => c.QuizId).ToHashSet();

        var pendingQuizzes = subjectQuizzes
            .Where(q => !completedQuizIds.Contains(q.Id))
            .Select(q => new PendingQuizItemDto
            {
                QuizId = q.Id,
                QuizTitle = q.Title,
                SubjectTitle = q.SubjectTitle,
                TotalScore = q.TotalScore
            })
            .ToList();

        var scoredPercentages = completedItems
            .Where(c => c.Percentage.HasValue)
            .Select(c => c.Percentage!.Value)
            .ToList();

        var totalLessonsAvailable = await _context.Lessons
            .AsNoTracking()
            .CountAsync(l => subjectIds.Contains(l.SubjectId) && l.IsPublished, cancellationToken);

        var completedLessonsCount = await _context.LessonProgresses
            .AsNoTracking()
            .CountAsync(
                lp => lp.StudentId == studentId
                      && lp.IsCompleted
                      && lp.Lesson != null
                      && subjectIds.Contains(lp.Lesson.SubjectId)
                      && lp.Lesson.IsPublished,
                cancellationToken);

        var dto = new StudentProgressDto
        {
            StudentId = student.Id,
            Name = student.Name,
            Email = student.Email,
            PhoneNumber = student.PhoneNumber,
            ParentPhoneNumber = student.ParentPhoneNumber,
            DateOfBirth = student.DateOfBirth,
            Gender = student.Gender,
            CreatedAt = student.CreatedAt,
            TotalQuizzesAvailable = subjectQuizzes.Count,
            CompletedQuizzes = completedQuizIds.Count,
            PendingQuizzesCount = pendingQuizzes.Count,
            TotalLessonsAvailable = totalLessonsAvailable,
            CompletedLessonsCount = completedLessonsCount,
            AverageScorePercentage = scoredPercentages.Count > 0
                ? Math.Round(scoredPercentages.Average(), 1)
                : null,
            LastSubmissionAt = completedItems.Count > 0 ? completedItems.Max(c => c.SubmittedAt) : null,
            Groups = memberships.Select(m => new StudentGroupSummaryDto
            {
                GroupId = m.GroupId,
                GroupName = m.GroupName,
                SubjectTitle = m.SubjectTitle,
                JoinedAt = m.JoinedAt
            }).ToList(),
            CompletedSubmissions = completedItems,
            PendingQuizzes = pendingQuizzes
        };

        return ServiceResult<StudentProgressDto>.Ok(dto, "Student progress fetched successfully.");
    }

    public async Task<ServiceResult<string>> ResetPasswordAsync(
        Guid studentId,
        ResetStudentPasswordDto request,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.HasPermission(AssistantPermissions.ManageGroups))
            return ServiceResult<string>.Forbidden();

        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<string>.NotFound("No tenant was resolved for this request.");

        // The global tenant filter keeps this lookup inside the caller's tenant.
        var student = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == UserRole.Student, cancellationToken);

        if (student is null)
            return ServiceResult<string>.NotFound("Student not found in this tenant.");

        student.PasswordHash = _passwordHasher.HashPassword(student, request.NewPassword);
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(studentId.ToString(), "Student password reset successfully.");
    }
}
