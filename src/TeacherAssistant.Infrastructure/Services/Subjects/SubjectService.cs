using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.Common.Validation;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Subjects;

public class SubjectService : ISubjectService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;

    public SubjectService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITenantService tenantService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tenantService = tenantService;
    }

    // ---------------------------------------------------------------------
    // Instructor: subjects
    // ---------------------------------------------------------------------

    public async Task<ServiceResult<IReadOnlyList<SubjectSummaryDto>>> GetMySubjectsAsync(
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Forbidden();

        if (!HasTenant)
            return NoTenant<IReadOnlyList<SubjectSummaryDto>>();

        var subjects = await _context.Subjects
            .AsNoTracking()
            .Where(s => s.InstructorId == instructorId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SubjectSummaryDto
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                ThumbnailUrl = s.ThumbnailUrl,
                IsPublished = s.IsPublished,
                LessonsCount = s.Lessons.Count,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Ok(
            subjects, "Subjects fetched successfully.");
    }

    public async Task<ServiceResult<SubjectSummaryDto>> CreateSubjectAsync(
        CreateSubjectDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<SubjectSummaryDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<SubjectSummaryDto>();

        var subject = new Subject
        {
            InstructorId = instructorId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            ThumbnailUrl = NormalizeOptional(request.ThumbnailUrl),
            IsPublished = request.IsPublished
        };

        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<SubjectSummaryDto>.Created(
            MapSummary(subject, 0), "Subject created successfully.");
    }

    public async Task<ServiceResult<SubjectDetailDto>> UpdateSubjectAsync(
        Guid subjectId,
        UpdateSubjectDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<SubjectDetailDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<SubjectDetailDto>();

        var subject = await _context.Subjects
            .Include(s => s.Instructor)
            .Include(s => s.Lessons)
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<SubjectDetailDto>.NotFound("Subject not found.");

        if (subject.InstructorId != instructorId)
            return ServiceResult<SubjectDetailDto>.Forbidden("You can only edit your own subjects.");

        subject.Title = request.Title.Trim();
        subject.Description = request.Description?.Trim() ?? string.Empty;
        subject.ThumbnailUrl = NormalizeOptional(request.ThumbnailUrl);
        subject.IsPublished = request.IsPublished;
        subject.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<SubjectDetailDto>.Ok(
            MapDetail(subject, includeDrafts: true), "Subject updated successfully.");
    }

    public async Task<ServiceResult<string>> DeleteSubjectAsync(
        Guid subjectId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<string>.Forbidden();

        if (!HasTenant)
            return NoTenant<string>();

        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<string>.NotFound("Subject not found.");

        if (subject.InstructorId != instructorId)
            return ServiceResult<string>.Forbidden("You can only delete your own subjects.");

        // Lessons, groups, memberships, enrollments and quizzes are removed by cascade.
        _context.Subjects.Remove(subject);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(subjectId.ToString(), "Subject deleted successfully.");
    }

    // ---------------------------------------------------------------------
    // Instructor: lessons
    // ---------------------------------------------------------------------

    public async Task<ServiceResult<LessonDto>> AddLessonAsync(
        Guid subjectId,
        CreateLessonDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<LessonDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<LessonDto>();

        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<LessonDto>.NotFound("Subject not found.");

        if (subject.InstructorId != instructorId)
            return ServiceResult<LessonDto>.Forbidden("You can only add lessons to your own subjects.");

        if (!UrlRules.IsHttpUrl(request.ContentUrl))
            return ServiceResult<LessonDto>.BadRequest("ContentUrl must be a valid http or https URL.");

        var lastSortOrder = await _context.Lessons
            .Where(l => l.SubjectId == subjectId)
            .MaxAsync(l => (int?)l.SortOrder, cancellationToken) ?? 0;

        var lesson = new Lesson
        {
            SubjectId = subjectId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            ContentType = request.ContentType,
            ContentUrl = request.ContentUrl.Trim(),
            SortOrder = lastSortOrder + 1,
            IsPublished = request.IsPublished
        };

        _context.Lessons.Add(lesson);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<LessonDto>.Created(
            MapFull(lesson, subject.Title), "Lesson added successfully.");
    }

    public async Task<ServiceResult<LessonDto>> UpdateLessonAsync(
        Guid lessonId,
        UpdateLessonDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<LessonDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<LessonDto>();

        var lesson = await _context.Lessons
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);

        if (lesson is null)
            return ServiceResult<LessonDto>.NotFound("Lesson not found.");

        if (lesson.Subject is null || lesson.Subject.InstructorId != instructorId)
            return ServiceResult<LessonDto>.Forbidden("You can only edit lessons of your own subjects.");

        if (!UrlRules.IsHttpUrl(request.ContentUrl))
            return ServiceResult<LessonDto>.BadRequest("ContentUrl must be a valid http or https URL.");

        lesson.Title = request.Title.Trim();
        lesson.Description = request.Description?.Trim() ?? string.Empty;
        lesson.ContentType = request.ContentType;
        lesson.ContentUrl = request.ContentUrl.Trim();
        lesson.IsPublished = request.IsPublished;
        lesson.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<LessonDto>.Ok(
            MapFull(lesson, lesson.Subject.Title), "Lesson updated successfully.");
    }

    public async Task<ServiceResult<string>> DeleteLessonAsync(
        Guid lessonId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<string>.Forbidden();

        if (!HasTenant)
            return NoTenant<string>();

        var lesson = await _context.Lessons
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);

        if (lesson is null)
            return ServiceResult<string>.NotFound("Lesson not found.");

        if (lesson.Subject is null || lesson.Subject.InstructorId != instructorId)
            return ServiceResult<string>.Forbidden("You can only delete lessons of your own subjects.");

        _context.Lessons.Remove(lesson);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(lessonId.ToString(), "Lesson deleted successfully.");
    }

    public async Task<ServiceResult<IReadOnlyList<LessonSummaryDto>>> ReorderLessonsAsync(
        Guid subjectId,
        ReorderLessonsDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<IReadOnlyList<LessonSummaryDto>>.Forbidden();

        if (!HasTenant)
            return NoTenant<IReadOnlyList<LessonSummaryDto>>();

        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<IReadOnlyList<LessonSummaryDto>>.NotFound("Subject not found.");

        if (subject.InstructorId != instructorId)
            return ServiceResult<IReadOnlyList<LessonSummaryDto>>.Forbidden(
                "You can only reorder lessons of your own subjects.");

        var lessons = await _context.Lessons
            .Where(l => l.SubjectId == subjectId)
            .ToListAsync(cancellationToken);

        var orderedIds = request.LessonIds ?? new List<Guid>();

        if (orderedIds.Count != lessons.Count || orderedIds.Distinct().Count() != orderedIds.Count)
        {
            return ServiceResult<IReadOnlyList<LessonSummaryDto>>.BadRequest(
                "The lesson list must contain every lesson of the subject exactly once.");
        }

        var lessonsById = lessons.ToDictionary(l => l.Id);
        if (orderedIds.Any(id => !lessonsById.ContainsKey(id)))
        {
            return ServiceResult<IReadOnlyList<LessonSummaryDto>>.BadRequest(
                "Every lesson id must belong to this subject.");
        }

        for (var index = 0; index < orderedIds.Count; index++)
        {
            var lesson = lessonsById[orderedIds[index]];
            lesson.SortOrder = index + 1;
            lesson.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var result = orderedIds.Select(id => MapSummary(lessonsById[id])).ToList();
        return ServiceResult<IReadOnlyList<LessonSummaryDto>>.Ok(result, "Lessons reordered successfully.");
    }

    // ---------------------------------------------------------------------
    // Public and authenticated reads
    // ---------------------------------------------------------------------

    public async Task<ServiceResult<IReadOnlyList<SubjectSummaryDto>>> GetSubjectsAsync(
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<IReadOnlyList<SubjectSummaryDto>>();

        var query = _context.Subjects
            .AsNoTracking()
            .Where(s => s.IsPublished);

        // A student only sees the published subjects they joined through a group.
        if (IsStudent && _currentUserService.UserId is { } studentId)
        {
            query = query.Where(s =>
                _context.GroupMemberships.Any(m => m.SubjectId == s.Id && m.StudentId == studentId));
        }

        var subjects = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SubjectSummaryDto
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                ThumbnailUrl = s.ThumbnailUrl,
                IsPublished = s.IsPublished,
                LessonsCount = s.Lessons.Count(l => l.IsPublished),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Ok(
            subjects, "Subjects fetched successfully.");
    }

    public async Task<ServiceResult<SubjectDetailDto>> GetSubjectDetailAsync(
        Guid subjectId,
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<SubjectDetailDto>();

        var subject = await _context.Subjects
            .AsNoTracking()
            .Include(s => s.Instructor)
            .Include(s => s.Lessons)
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<SubjectDetailDto>.NotFound("Subject not found.");

        var userId = _currentUserService.UserId;
        var isOwner = userId is { } owner && subject.InstructorId == owner;

        if (!isOwner && !subject.IsPublished)
            return ServiceResult<SubjectDetailDto>.NotFound("Subject not found.");

        // Members only: a student outside the subject must not see its content.
        if (!isOwner && IsStudent && userId is { } studentId &&
            !await IsMemberAsync(subject.Id, studentId, cancellationToken))
        {
            return ServiceResult<SubjectDetailDto>.NotFound("Subject not found.");
        }

        return ServiceResult<SubjectDetailDto>.Ok(
            MapDetail(subject, includeDrafts: isOwner), "Subject fetched successfully.");
    }

    public async Task<ServiceResult<LessonDto>> GetLessonAsync(
        Guid lessonId,
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<LessonDto>();

        if (_currentUserService.UserId is not { } userId || !_currentUserService.IsAuthenticated)
            return ServiceResult<LessonDto>.Forbidden("You must be logged in to view a lesson.");

        // A platform-admin token has no tenant; only users of the current tenant may read lessons.
        if (_currentUserService.TenantId is null ||
            _currentUserService.TenantId != _tenantService.TenantId)
        {
            return ServiceResult<LessonDto>.Forbidden("You do not have access to this tenant.");
        }

        var lesson = await _context.Lessons
            .AsNoTracking()
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);

        if (lesson is null)
            return ServiceResult<LessonDto>.NotFound("Lesson not found.");

        var isOwner = lesson.Subject is not null && lesson.Subject.InstructorId == userId;

        if (!isOwner)
        {
            // Students only see published content of published subjects they joined.
            if (!IsStudent ||
                lesson.Subject is null ||
                !lesson.Subject.IsPublished ||
                !lesson.IsPublished ||
                !await IsMemberAsync(lesson.SubjectId, userId, cancellationToken))
            {
                return ServiceResult<LessonDto>.NotFound("Lesson not found.");
            }
        }

        return ServiceResult<LessonDto>.Ok(
            MapFull(lesson, lesson.Subject?.Title ?? string.Empty), "Lesson fetched successfully.");
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private bool HasTenant => _tenantService.HasTenant && _tenantService.TenantId is not null;

    private bool IsStudent => string.Equals(
        _currentUserService.Role, nameof(UserRole.Student), StringComparison.Ordinal);

    private Task<bool> IsMemberAsync(Guid subjectId, Guid studentId, CancellationToken cancellationToken)
        => _context.GroupMemberships
            .AnyAsync(m => m.SubjectId == subjectId && m.StudentId == studentId, cancellationToken);

    private bool TryGetInstructorId(out Guid instructorId)
    {
        instructorId = _currentUserService.UserId ?? Guid.Empty;
        return instructorId != Guid.Empty
            && string.Equals(_currentUserService.Role, nameof(UserRole.Instructor), StringComparison.Ordinal);
    }

    private static ServiceResult<T> NoTenant<T>()
        => ServiceResult<T>.NotFound("No tenant was resolved for this request.");

    private static SubjectSummaryDto MapSummary(Subject subject, int lessonsCount) => new()
    {
        Id = subject.Id,
        Title = subject.Title,
        Description = subject.Description,
        ThumbnailUrl = subject.ThumbnailUrl,
        IsPublished = subject.IsPublished,
        LessonsCount = lessonsCount,
        CreatedAt = subject.CreatedAt
    };

    private static LessonSummaryDto MapSummary(Lesson lesson) => new()
    {
        Id = lesson.Id,
        Title = lesson.Title,
        Description = lesson.Description,
        ContentType = lesson.ContentType,
        SortOrder = lesson.SortOrder,
        IsPublished = lesson.IsPublished
    };

    private static SubjectDetailDto MapDetail(Subject subject, bool includeDrafts) => new()
    {
        Id = subject.Id,
        InstructorId = subject.InstructorId,
        InstructorName = subject.Instructor?.Name ?? string.Empty,
        Title = subject.Title,
        Description = subject.Description,
        ThumbnailUrl = subject.ThumbnailUrl,
        IsPublished = subject.IsPublished,
        CreatedAt = subject.CreatedAt,
        UpdatedAt = subject.UpdatedAt,
        Lessons = subject.Lessons
            .Where(l => includeDrafts || l.IsPublished)
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.CreatedAt)
            .Select(MapSummary)
            .ToList()
    };

    private static LessonDto MapFull(Lesson lesson, string subjectTitle) => new()
    {
        Id = lesson.Id,
        SubjectId = lesson.SubjectId,
        SubjectTitle = subjectTitle,
        Title = lesson.Title,
        Description = lesson.Description,
        ContentType = lesson.ContentType,
        ContentUrl = lesson.ContentUrl,
        SortOrder = lesson.SortOrder,
        IsPublished = lesson.IsPublished
    };

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
