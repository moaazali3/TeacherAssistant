using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Groups;

namespace TeacherAssistant.Application.Interfaces;

public interface IGroupService
{
    // Instructor: groups of one subject
    Task<ServiceResult<IReadOnlyList<GroupDto>>> GetGroupsAsync(
        Guid subjectId, CancellationToken cancellationToken = default);

    Task<ServiceResult<GroupDto>> CreateGroupAsync(
        Guid subjectId, CreateGroupDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<GroupDto>> UpdateGroupAsync(
        Guid groupId, UpdateGroupDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<string>> DeleteGroupAsync(
        Guid groupId, CancellationToken cancellationToken = default);

    Task<ServiceResult<GroupDto>> RegenerateCodeAsync(
        Guid groupId, CancellationToken cancellationToken = default);

    Task<ServiceResult<GroupDto>> ToggleCodeAsync(
        Guid groupId, CancellationToken cancellationToken = default);

    // Instructor: members of one group
    Task<ServiceResult<IReadOnlyList<GroupMemberDto>>> GetStudentsAsync(
        Guid groupId, CancellationToken cancellationToken = default);

    Task<ServiceResult<GroupMemberDto>> MoveStudentAsync(
        Guid groupId, Guid studentId, MoveStudentDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<string>> RemoveStudentAsync(
        Guid groupId, Guid studentId, CancellationToken cancellationToken = default);

    // Student
    Task<ServiceResult<MyGroupDto>> JoinAsync(
        JoinGroupDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<IReadOnlyList<MyGroupDto>>> GetMyGroupsAsync(
        CancellationToken cancellationToken = default);
}
