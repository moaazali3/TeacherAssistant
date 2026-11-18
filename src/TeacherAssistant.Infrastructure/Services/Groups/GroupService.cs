using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Groups;

public class GroupService : IGroupService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;

    public GroupService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITenantService tenantService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tenantService = tenantService;
    }

    // ---------------------------------------------------------------------
    // Instructor: group management
    // ---------------------------------------------------------------------

    public async Task<ServiceResult<IReadOnlyList<GroupDto>>> GetGroupsAsync(
        Guid subjectId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<IReadOnlyList<GroupDto>>.Forbidden();

        if (!HasTenant)
            return NoTenant<IReadOnlyList<GroupDto>>();

        var subject = await _context.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<IReadOnlyList<GroupDto>>.NotFound("Subject not found.");

        if (subject.InstructorId != instructorId)
            return ServiceResult<IReadOnlyList<GroupDto>>.Forbidden(
                "You can only manage groups of your own subjects.");

        var groups = await _context.Groups
            .AsNoTracking()
            .Where(g => g.SubjectId == subjectId)
            .OrderBy(g => g.Name)
            .Select(g => new GroupDto
            {
                Id = g.Id,
                SubjectId = g.SubjectId,
                SubjectTitle = subject.Title,
                Name = g.Name,
                ScheduleText = g.ScheduleText,
                JoinCode = g.JoinCode,
                IsCodeActive = g.IsCodeActive,
                IsOpen = g.IsOpen,
                StudentsCount = g.Memberships.Count,
                CreatedAt = g.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<GroupDto>>.Ok(groups, "Groups fetched successfully.");
    }

    public async Task<ServiceResult<GroupDto>> CreateGroupAsync(
        Guid subjectId,
        CreateGroupDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<GroupDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<GroupDto>();

        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == subjectId, cancellationToken);

        if (subject is null)
            return ServiceResult<GroupDto>.NotFound("Subject not found.");

        if (subject.InstructorId != instructorId)
            return ServiceResult<GroupDto>.Forbidden("You can only manage groups of your own subjects.");

        var group = new Group
        {
            SubjectId = subjectId,
            Name = request.Name.Trim(),
            ScheduleText = NormalizeOptional(request.ScheduleText),
            JoinCode = await GenerateUniqueJoinCodeAsync(cancellationToken),
            IsCodeActive = true,
            IsOpen = request.IsOpen
        };

        _context.Groups.Add(group);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<GroupDto>.Created(Map(group, subject.Title, 0), "Group created successfully.");
    }

    public async Task<ServiceResult<GroupDto>> UpdateGroupAsync(
        Guid groupId,
        UpdateGroupDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<GroupDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<GroupDto>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<GroupDto>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<GroupDto>.Forbidden("You can only manage groups of your own subjects.");

        group.Name = request.Name.Trim();
        group.ScheduleText = NormalizeOptional(request.ScheduleText);
        group.IsOpen = request.IsOpen;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var studentsCount = await _context.GroupMemberships
            .CountAsync(m => m.GroupId == groupId, cancellationToken);

        return ServiceResult<GroupDto>.Ok(
            Map(group, group.Subject.Title, studentsCount), "Group updated successfully.");
    }

    public async Task<ServiceResult<string>> DeleteGroupAsync(
        Guid groupId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<string>.Forbidden();

        if (!HasTenant)
            return NoTenant<string>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<string>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<string>.Forbidden("You can only manage groups of your own subjects.");

        // Memberships are removed by cascade; the student accounts stay.
        _context.Groups.Remove(group);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(groupId.ToString(), "Group deleted successfully.");
    }

    public async Task<ServiceResult<GroupDto>> RegenerateCodeAsync(
        Guid groupId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<GroupDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<GroupDto>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<GroupDto>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<GroupDto>.Forbidden("You can only manage groups of your own subjects.");

        group.JoinCode = await GenerateUniqueJoinCodeAsync(cancellationToken);
        group.IsCodeActive = true;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var studentsCount = await _context.GroupMemberships
            .CountAsync(m => m.GroupId == groupId, cancellationToken);

        return ServiceResult<GroupDto>.Ok(
            Map(group, group.Subject.Title, studentsCount), "Join code regenerated successfully.");
    }

    public async Task<ServiceResult<GroupDto>> ToggleCodeAsync(
        Guid groupId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<GroupDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<GroupDto>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<GroupDto>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<GroupDto>.Forbidden("You can only manage groups of your own subjects.");

        group.IsCodeActive = !group.IsCodeActive;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var studentsCount = await _context.GroupMemberships
            .CountAsync(m => m.GroupId == groupId, cancellationToken);

        var message = group.IsCodeActive
            ? "Join code activated successfully."
            : "Join code deactivated successfully.";

        return ServiceResult<GroupDto>.Ok(Map(group, group.Subject.Title, studentsCount), message);
    }

    // ---------------------------------------------------------------------
    // Instructor: group members
    // ---------------------------------------------------------------------

    public async Task<ServiceResult<IReadOnlyList<GroupMemberDto>>> GetStudentsAsync(
        Guid groupId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<IReadOnlyList<GroupMemberDto>>.Forbidden();

        if (!HasTenant)
            return NoTenant<IReadOnlyList<GroupMemberDto>>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<IReadOnlyList<GroupMemberDto>>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<IReadOnlyList<GroupMemberDto>>.Forbidden(
                "You can only view students of your own groups.");

        var students = await _context.GroupMemberships
            .AsNoTracking()
            .Where(m => m.GroupId == groupId)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new GroupMemberDto
            {
                GroupId = groupId,
                GroupName = group.Name,
                StudentId = m.StudentId,
                Name = m.Student != null ? m.Student.Name : string.Empty,
                Email = m.Student != null ? m.Student.Email : string.Empty,
                JoinedAt = m.JoinedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<GroupMemberDto>>.Ok(students, "Students fetched successfully.");
    }

    public async Task<ServiceResult<GroupMemberDto>> MoveStudentAsync(
        Guid groupId,
        Guid studentId,
        MoveStudentDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<GroupMemberDto>.Forbidden();

        if (!HasTenant)
            return NoTenant<GroupMemberDto>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<GroupMemberDto>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<GroupMemberDto>.Forbidden("You can only manage students of your own groups.");

        if (request.TargetGroupId == Guid.Empty)
            return ServiceResult<GroupMemberDto>.BadRequest("TargetGroupId is required.");

        if (request.TargetGroupId == groupId)
            return ServiceResult<GroupMemberDto>.BadRequest("The student is already in this group.");

        var targetGroup = await _context.Groups
            .FirstOrDefaultAsync(g => g.Id == request.TargetGroupId, cancellationToken);

        if (targetGroup is null)
            return ServiceResult<GroupMemberDto>.BadRequest("Target group not found.");

        if (targetGroup.SubjectId != group.SubjectId)
            return ServiceResult<GroupMemberDto>.BadRequest(
                "A student can only be moved between groups of the same subject.");

        var membership = await _context.GroupMemberships
            .Include(m => m.Student)
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.StudentId == studentId, cancellationToken);

        if (membership is null)
            return ServiceResult<GroupMemberDto>.NotFound("Student is not a member of this group.");

        membership.GroupId = targetGroup.Id;
        membership.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<GroupMemberDto>.Ok(new GroupMemberDto
        {
            GroupId = targetGroup.Id,
            GroupName = targetGroup.Name,
            StudentId = membership.StudentId,
            Name = membership.Student?.Name ?? string.Empty,
            Email = membership.Student?.Email ?? string.Empty,
            JoinedAt = membership.JoinedAt
        }, "Student moved successfully.");
    }

    public async Task<ServiceResult<string>> RemoveStudentAsync(
        Guid groupId,
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out var instructorId))
            return ServiceResult<string>.Forbidden();

        if (!HasTenant)
            return NoTenant<string>();

        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
            return ServiceResult<string>.NotFound("Group not found.");

        if (group.Subject is null || group.Subject.InstructorId != instructorId)
            return ServiceResult<string>.Forbidden("You can only manage students of your own groups.");

        var membership = await _context.GroupMemberships
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.StudentId == studentId, cancellationToken);

        if (membership is null)
            return ServiceResult<string>.NotFound("Student is not a member of this group.");

        _context.GroupMemberships.Remove(membership);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(studentId.ToString(), "Student removed from the group successfully.");
    }

    // ---------------------------------------------------------------------
    // Student
    // ---------------------------------------------------------------------

    public async Task<ServiceResult<MyGroupDto>> JoinAsync(
        JoinGroupDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetStudentId(out var studentId))
            return ServiceResult<MyGroupDto>.Forbidden("Only students can join groups with a code.");

        if (!HasTenant)
            return NoTenant<MyGroupDto>();

        var code = JoinCodeRules.Normalize(request.Code);
        if (!JoinCodeRules.IsValidFormat(code))
            return ServiceResult<MyGroupDto>.BadRequest("Join code must be 8 characters (letters and digits).");

        var group = await _context.Groups
            .Include(g => g.Subject)
            .ThenInclude(s => s!.Instructor)
            .FirstOrDefaultAsync(g => g.JoinCode == code, cancellationToken);

        if (group is null || group.Subject is null)
            return ServiceResult<MyGroupDto>.BadRequest("Invalid join code.");

        if (!group.IsCodeActive)
            return ServiceResult<MyGroupDto>.BadRequest("This join code is no longer active.");

        if (!group.IsOpen)
            return ServiceResult<MyGroupDto>.BadRequest("This group is not accepting new students.");

        var alreadyJoined = await _context.GroupMemberships
            .AnyAsync(m => m.StudentId == studentId && m.SubjectId == group.SubjectId, cancellationToken);

        if (alreadyJoined)
            return ServiceResult<MyGroupDto>.Conflict("You already joined a group in this subject.");

        var membership = new GroupMembership
        {
            GroupId = group.Id,
            SubjectId = group.SubjectId,
            StudentId = studentId
        };

        _context.GroupMemberships.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<MyGroupDto>.Created(
            MapMyGroup(membership, group), "Joined the group successfully.");
    }

    public async Task<ServiceResult<IReadOnlyList<MyGroupDto>>> GetMyGroupsAsync(
        CancellationToken cancellationToken = default)
    {
        if (!TryGetStudentId(out var studentId))
            return ServiceResult<IReadOnlyList<MyGroupDto>>.Forbidden("Only students have group memberships.");

        if (!HasTenant)
            return NoTenant<IReadOnlyList<MyGroupDto>>();

        var groups = await _context.GroupMemberships
            .AsNoTracking()
            .Where(m => m.StudentId == studentId)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new MyGroupDto
            {
                GroupId = m.GroupId,
                GroupName = m.Group != null ? m.Group.Name : string.Empty,
                ScheduleText = m.Group != null ? m.Group.ScheduleText : null,
                SubjectId = m.SubjectId,
                SubjectTitle = m.Group != null && m.Group.Subject != null ? m.Group.Subject.Title : string.Empty,
                InstructorName = m.Group != null && m.Group.Subject != null && m.Group.Subject.Instructor != null
                    ? m.Group.Subject.Instructor.Name
                    : string.Empty,
                JoinedAt = m.JoinedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<MyGroupDto>>.Ok(groups, "Your groups fetched successfully.");
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private bool HasTenant => _tenantService.HasTenant && _tenantService.TenantId is not null;

    private bool TryGetInstructorId(out Guid instructorId)
    {
        instructorId = _currentUserService.UserId ?? Guid.Empty;
        return instructorId != Guid.Empty
            && string.Equals(_currentUserService.Role, nameof(UserRole.Instructor), StringComparison.Ordinal);
    }

    private bool TryGetStudentId(out Guid studentId)
    {
        studentId = _currentUserService.UserId ?? Guid.Empty;
        return studentId != Guid.Empty
            && string.Equals(_currentUserService.Role, nameof(UserRole.Student), StringComparison.Ordinal);
    }

    private async Task<string> GenerateUniqueJoinCodeAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var code = JoinCodeRules.Generate();
            if (!await _context.Groups.AnyAsync(g => g.JoinCode == code, cancellationToken))
                return code;
        }

        throw new InvalidOperationException("Unable to generate a unique join code.");
    }

    private static GroupDto Map(Group group, string subjectTitle, int studentsCount) => new()
    {
        Id = group.Id,
        SubjectId = group.SubjectId,
        SubjectTitle = subjectTitle,
        Name = group.Name,
        ScheduleText = group.ScheduleText,
        JoinCode = group.JoinCode,
        IsCodeActive = group.IsCodeActive,
        IsOpen = group.IsOpen,
        StudentsCount = studentsCount,
        CreatedAt = group.CreatedAt
    };

    private static MyGroupDto MapMyGroup(GroupMembership membership, Group group) => new()
    {
        GroupId = group.Id,
        GroupName = group.Name,
        ScheduleText = group.ScheduleText,
        SubjectId = group.SubjectId,
        SubjectTitle = group.Subject?.Title ?? string.Empty,
        InstructorName = group.Subject?.Instructor?.Name ?? string.Empty,
        JoinedAt = membership.JoinedAt
    };

    private static ServiceResult<T> NoTenant<T>()
        => ServiceResult<T>.NotFound("No tenant was resolved for this request.");

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
