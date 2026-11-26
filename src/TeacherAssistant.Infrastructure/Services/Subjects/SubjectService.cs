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
                GradeLevel = s.GradeLevel,
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
            GradeLevel = NormalizeOptional(request.GradeLevel),
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
        subject.GradeLevel = NormalizeOptional(request.GradeLevel);
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

        if (!string.IsNullOrWhiteSpace(request.AttachmentUrl) && !UrlRules.IsHttpUrl(request.AttachmentUrl))
            return ServiceResult<LessonDto>.BadRequest("AttachmentUrl must be a valid http or https URL.");

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
            IsPublished = request.IsPublished,
            Price = request.Price,
            ModuleTitle = NormalizeOptional(request.ModuleTitle),
            AvailableAt = NormalizeUtc(request.AvailableAt),
            RequiresPreviousCompletion = request.RequiresPreviousCompletion,
            AttachmentUrl = NormalizeOptional(request.AttachmentUrl)
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

        if (!string.IsNullOrWhiteSpace(request.AttachmentUrl) && !UrlRules.IsHttpUrl(request.AttachmentUrl))
            return ServiceResult<LessonDto>.BadRequest("AttachmentUrl must be a valid http or https URL.");

        lesson.Title = request.Title.Trim();
        lesson.Description = request.Description?.Trim() ?? string.Empty;
        lesson.ContentType = request.ContentType;
        lesson.ContentUrl = request.ContentUrl.Trim();
        lesson.IsPublished = request.IsPublished;
        lesson.Price = request.Price;
        lesson.ModuleTitle = NormalizeOptional(request.ModuleTitle);
        lesson.AvailableAt = NormalizeUtc(request.AvailableAt);
        lesson.RequiresPreviousCompletion = request.RequiresPreviousCompletion;
        lesson.AttachmentUrl = NormalizeOptional(request.AttachmentUrl);
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
                GradeLevel = s.GradeLevel,
                ThumbnailUrl = s.ThumbnailUrl,
                IsPublished = s.IsPublished,
                LessonsCount = s.Lessons.Count(l => l.IsPublished),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Ok(
            subjects, "Subjects fetched successfully.");
    }

    public async Task<ServiceResult<IReadOnlyList<SubjectSummaryDto>>> GetSameGradeAvailableSubjectsAsync(
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<IReadOnlyList<SubjectSummaryDto>>();

        if (!IsStudent || _currentUserService.UserId is not { } studentId)
            return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Forbidden();

        var studentGradeLevels = await _context.GroupMemberships
            .AsNoTracking()
            .Where(m => m.StudentId == studentId && m.Group != null && m.Group.Subject != null &&
                        m.Group.Subject.GradeLevel != null && m.Group.Subject.GradeLevel != "")
            .Select(m => m.Group!.Subject!.GradeLevel!)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (studentGradeLevels.Count == 0)
        {
            return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Ok(
                Array.Empty<SubjectSummaryDto>(), "No matching grade-level subjects found.");
        }

        var availableSubjects = await _context.Subjects
            .AsNoTracking()
            .Where(s => s.IsPublished
                        && s.GradeLevel != null
                        && studentGradeLevels.Contains(s.GradeLevel)
                        && !_context.GroupMemberships.Any(m => m.SubjectId == s.Id && m.StudentId == studentId))
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SubjectSummaryDto
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                GradeLevel = s.GradeLevel,
                ThumbnailUrl = s.ThumbnailUrl,
                IsPublished = s.IsPublished,
                LessonsCount = s.Lessons.Count(l => l.IsPublished),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<SubjectSummaryDto>>.Ok(
            availableSubjects, "Same-grade available subjects fetched successfully.");
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

        Dictionary<Guid, LessonProgress>? progressByLesson = null;
        HashSet<Guid>? purchasedLessonIds = null;
        if (!isOwner && IsStudent && userId is { } progressStudentId)
        {
            var lessonIds = subject.Lessons.Select(l => l.Id).ToList();
            progressByLesson = await _context.LessonProgresses
                .AsNoTracking()
                .Where(lp => lp.StudentId == progressStudentId && lessonIds.Contains(lp.LessonId))
                .ToDictionaryAsync(lp => lp.LessonId, cancellationToken);

            var purchasedIdsList = await _context.LessonPurchases
                .AsNoTracking()
                .Where(lp => lp.StudentId == progressStudentId
                             && lessonIds.Contains(lp.LessonId)
                             && lp.Status == PaymentStatus.Completed)
                .Select(lp => lp.LessonId)
                .ToListAsync(cancellationToken);

            purchasedLessonIds = purchasedIdsList.ToHashSet();
        }

        return ServiceResult<SubjectDetailDto>.Ok(
            MapDetail(subject, includeDrafts: isOwner, progressByLesson, purchasedLessonIds),
            "Subject fetched successfully.");
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

            var lockError = await CheckStudentLessonLockAsync(lesson, userId, cancellationToken);
            if (lockError is not null)
                return ServiceResult<LessonDto>.Forbidden(lockError);

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(lp => lp.StudentId == userId && lp.LessonId == lesson.Id, cancellationToken);

            if (progress is null)
            {
                progress = new LessonProgress
                {
                    StudentId = userId,
                    LessonId = lesson.Id,
                    ViewCount = 1,
                    LastViewedAt = DateTime.UtcNow
                };
                _context.LessonProgresses.Add(progress);
            }
            else
            {
                progress.ViewCount++;
                progress.LastViewedAt = DateTime.UtcNow;
                progress.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return ServiceResult<LessonDto>.Ok(
                MapFull(lesson, lesson.Subject.Title, progress.IsCompleted, progress.ViewCount, isPurchased: true),
                "Lesson fetched successfully.");
        }

        return ServiceResult<LessonDto>.Ok(
            MapFull(lesson, lesson.Subject?.Title ?? string.Empty), "Lesson fetched successfully.");
    }

    public async Task<ServiceResult<LessonDto>> MarkLessonCompletedAsync(
        Guid lessonId,
        CancellationToken cancellationToken = default)
    {
        if (!HasTenant)
            return NoTenant<LessonDto>();

        if (_currentUserService.UserId is not { } userId || !IsStudent)
            return ServiceResult<LessonDto>.Forbidden("Only students can complete lessons.");

        var lesson = await _context.Lessons
            .AsNoTracking()
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);

        if (lesson is null || lesson.Subject is null || !lesson.Subject.IsPublished || !lesson.IsPublished ||
            !await IsMemberAsync(lesson.SubjectId, userId, cancellationToken))
        {
            return ServiceResult<LessonDto>.NotFound("Lesson not found.");
        }

        var lockError = await CheckStudentLessonLockAsync(lesson, userId, cancellationToken);
        if (lockError is not null)
            return ServiceResult<LessonDto>.Forbidden(lockError);

        var progress = await _context.LessonProgresses
            .FirstOrDefaultAsync(lp => lp.StudentId == userId && lp.LessonId == lesson.Id, cancellationToken);

        if (progress is null)
        {
            progress = new LessonProgress
            {
                StudentId = userId,
                LessonId = lesson.Id,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow,
                ViewCount = 1,
                LastViewedAt = DateTime.UtcNow
            };
            _context.LessonProgresses.Add(progress);
        }
        else
        {
            progress.IsCompleted = true;
            progress.CompletedAt ??= DateTime.UtcNow;
            if (progress.ViewCount == 0) progress.ViewCount = 1;
            progress.LastViewedAt = DateTime.UtcNow;
            progress.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<LessonDto>.Ok(
            MapFull(lesson, lesson.Subject.Title, progress.IsCompleted, progress.ViewCount, isPurchased: true),
            "Lesson marked as completed.");
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
        GradeLevel = subject.GradeLevel,
        ThumbnailUrl = subject.ThumbnailUrl,
        IsPublished = subject.IsPublished,
        LessonsCount = lessonsCount,
        CreatedAt = subject.CreatedAt
    };

    private async Task<string?> CheckStudentLessonLockAsync(
        Lesson lesson,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        if (lesson.AvailableAt.HasValue && lesson.AvailableAt.Value > DateTime.UtcNow)
            return "هذه المحاضرة مجدولة ولم يحن موعد فتحها بعد.";

        if (lesson.Price > 0)
        {
            var purchased = await _context.LessonPurchases
                .AsNoTracking()
                .AnyAsync(
                    lp => lp.StudentId == studentId && lp.LessonId == lesson.Id && lp.Status == PaymentStatus.Completed,
                    cancellationToken);

            if (!purchased)
                return "هذه المحاضرة مدفوعة. يرجى إتمام الشراء أولاً لفتحها.";
        }

        if (!lesson.RequiresPreviousCompletion)
            return null;

        var orderedLessons = await _context.Lessons
            .AsNoTracking()
            .Where(l => l.SubjectId == lesson.SubjectId && l.IsPublished)
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.CreatedAt)
            .Select(l => new { l.Id, l.Title })
            .ToListAsync(cancellationToken);

        var idx = orderedLessons.FindIndex(l => l.Id == lesson.Id);
        if (idx <= 0)
            return null;

        var prevLesson = orderedLessons[idx - 1];
        var prevCompleted = await _context.LessonProgresses
            .AsNoTracking()
            .AnyAsync(
                lp => lp.StudentId == studentId && lp.LessonId == prevLesson.Id && lp.IsCompleted,
                cancellationToken);

        return prevCompleted
            ? null
            : $"يجب إتمام المحاضرة السابقة ({prevLesson.Title}) أولاً لفتح هذه المحاضرة.";
    }

    private static LessonSummaryDto MapSummary(Lesson lesson) => new()
    {
        Id = lesson.Id,
        Title = lesson.Title,
        Description = lesson.Description,
        ContentType = lesson.ContentType,
        SortOrder = lesson.SortOrder,
        IsPublished = lesson.IsPublished,
        Price = lesson.Price,
        IsPurchased = lesson.Price <= 0,
        ModuleTitle = lesson.ModuleTitle,
        AvailableAt = lesson.AvailableAt,
        RequiresPreviousCompletion = lesson.RequiresPreviousCompletion,
        AttachmentUrl = lesson.AttachmentUrl
    };

    private static SubjectDetailDto MapDetail(
        Subject subject,
        bool includeDrafts,
        Dictionary<Guid, LessonProgress>? progressByLesson = null,
        HashSet<Guid>? purchasedLessonIds = null)
    {
        var ordered = subject.Lessons
            .Where(l => includeDrafts || l.IsPublished)
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.CreatedAt)
            .ToList();

        var summaries = new List<LessonSummaryDto>(ordered.Count);
        var now = DateTime.UtcNow;

        for (var i = 0; i < ordered.Count; i++)
        {
            var lesson = ordered[i];
            LessonProgress? progress = null;
            progressByLesson?.TryGetValue(lesson.Id, out progress);

            var dto = MapSummary(lesson);
            dto.IsCompleted = progress?.IsCompleted ?? false;
            dto.ViewCount = progress?.ViewCount ?? 0;

            if (progressByLesson is not null)
            {
                var isPurchased = lesson.Price <= 0 || (purchasedLessonIds?.Contains(lesson.Id) ?? false);
                dto.IsPurchased = isPurchased;

                if (lesson.AvailableAt.HasValue && lesson.AvailableAt.Value > now)
                {
                    dto.IsLocked = true;
                    dto.LockReason = "scheduled";
                }
                else if (lesson.Price > 0 && !isPurchased)
                {
                    dto.IsLocked = true;
                    dto.LockReason = "payment_required";
                }
                else if (lesson.RequiresPreviousCompletion && i > 0 && !summaries[i - 1].IsCompleted)
                {
                    dto.IsLocked = true;
                    dto.LockReason = $"يجب إتمام الدرس السابق ({summaries[i - 1].Title}) أولاً.";
                }
            }

            summaries.Add(dto);
        }

        return new SubjectDetailDto
        {
            Id = subject.Id,
            InstructorId = subject.InstructorId,
            InstructorName = subject.Instructor?.Name ?? string.Empty,
            Title = subject.Title,
            Description = subject.Description,
            GradeLevel = subject.GradeLevel,
            ThumbnailUrl = subject.ThumbnailUrl,
            IsPublished = subject.IsPublished,
            CreatedAt = subject.CreatedAt,
            UpdatedAt = subject.UpdatedAt,
            Lessons = summaries
        };
    }

    private static LessonDto MapFull(
        Lesson lesson,
        string subjectTitle,
        bool isCompleted = false,
        int viewCount = 0,
        bool isPurchased = true) => new()
    {
        Id = lesson.Id,
        SubjectId = lesson.SubjectId,
        SubjectTitle = subjectTitle,
        Title = lesson.Title,
        Description = lesson.Description,
        ContentType = lesson.ContentType,
        ContentUrl = lesson.ContentUrl,
        SortOrder = lesson.SortOrder,
        IsPublished = lesson.IsPublished,
        Price = lesson.Price,
        IsPurchased = isPurchased,
        ModuleTitle = lesson.ModuleTitle,
        AvailableAt = lesson.AvailableAt,
        RequiresPreviousCompletion = lesson.RequiresPreviousCompletion,
        AttachmentUrl = lesson.AttachmentUrl,
        IsCompleted = isCompleted,
        ViewCount = viewCount
    };

    private static DateTime? NormalizeUtc(DateTime? dt)
        => dt is null ? null : (dt.Value.Kind == DateTimeKind.Utc ? dt.Value : dt.Value.ToUniversalTime());

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
