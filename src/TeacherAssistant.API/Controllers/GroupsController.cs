using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.API.Configuration;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Groups;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class GroupsController : BaseApiController
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    // ---------------------------------------------------------------------
    // Subject-scoped group management (instructor)
    // ---------------------------------------------------------------------

    /// <summary>Groups of one subject.</summary>
    [HttpGet("/api/v1/subjects/{subjectId:guid}/groups")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GroupDto>>>> GetGroups(
        [FromRoute] Guid subjectId,
        CancellationToken cancellationToken)
        => Map(await _groupService.GetGroupsAsync(subjectId, cancellationToken));

    [HttpPost("/api/v1/subjects/{subjectId:guid}/groups")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<GroupDto>>> CreateGroup(
        [FromRoute] Guid subjectId,
        [FromBody] CreateGroupDto request,
        CancellationToken cancellationToken)
        => Map(await _groupService.CreateGroupAsync(subjectId, request, cancellationToken));

    // ---------------------------------------------------------------------
    // Group management (instructor)
    // ---------------------------------------------------------------------

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<GroupDto>>> Update(
        [FromRoute] Guid id,
        [FromBody] UpdateGroupDto request,
        CancellationToken cancellationToken)
        => Map(await _groupService.UpdateGroupAsync(id, request, cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _groupService.DeleteGroupAsync(id, cancellationToken));

    [HttpPost("{id:guid}/regenerate-code")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<GroupDto>>> RegenerateCode(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _groupService.RegenerateCodeAsync(id, cancellationToken));

    [HttpPost("{id:guid}/toggle-code")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<GroupDto>>> ToggleCode(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _groupService.ToggleCodeAsync(id, cancellationToken));

    [HttpGet("{id:guid}/students")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GroupMemberDto>>>> GetStudents(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _groupService.GetStudentsAsync(id, cancellationToken));

    [HttpPut("{id:guid}/students/{studentId:guid}/move")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<GroupMemberDto>>> MoveStudent(
        [FromRoute] Guid id,
        [FromRoute] Guid studentId,
        [FromBody] MoveStudentDto request,
        CancellationToken cancellationToken)
        => Map(await _groupService.MoveStudentAsync(id, studentId, request, cancellationToken));

    [HttpDelete("{id:guid}/students/{studentId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<string>>> RemoveStudent(
        [FromRoute] Guid id,
        [FromRoute] Guid studentId,
        CancellationToken cancellationToken)
        => Map(await _groupService.RemoveStudentAsync(id, studentId, cancellationToken));

    // ---------------------------------------------------------------------
    // Student
    // ---------------------------------------------------------------------

    /// <summary>Join a group of another subject with a join code.</summary>
    [HttpPost("join")]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [EnableRateLimiting(RateLimitPolicies.JoinCode)]
    public async Task<ActionResult<ApiResponse<MyGroupDto>>> Join(
        [FromBody] JoinGroupDto request,
        CancellationToken cancellationToken)
        => Map(await _groupService.JoinAsync(request, cancellationToken));

    [HttpGet("mine")]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MyGroupDto>>>> GetMine(
        CancellationToken cancellationToken)
        => Map(await _groupService.GetMyGroupsAsync(cancellationToken));

    private ActionResult<ApiResponse<T>> Map<T>(ServiceResult<T> result)
        => StatusCode(result.StatusCode, result.Response);
}
