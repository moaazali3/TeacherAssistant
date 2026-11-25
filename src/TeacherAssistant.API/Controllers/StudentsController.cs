using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Students;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class StudentsController : BaseApiController
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    /// <summary>List all students in the tenant with group & quiz progress summaries.</summary>
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.InstructorOrAssistant)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StudentSummaryDto>>>> GetStudents(
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var result = await _studentService.GetStudentsAsync(search, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>Get detailed 360 progress (groups, completed quizzes, pending quizzes) for a student.</summary>
    [HttpGet("{id:guid}/progress")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOrAssistant)]
    public async Task<ActionResult<ApiResponse<StudentProgressDto>>> GetProgress(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _studentService.GetStudentProgressAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>Reset a student's password. The student must belong to the caller's tenant.</summary>
    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOrAssistant)]
    public async Task<ActionResult<ApiResponse<string>>> ResetPassword(
        [FromRoute] Guid id,
        [FromBody] ResetStudentPasswordDto request,
        CancellationToken cancellationToken)
    {
        var result = await _studentService.ResetPasswordAsync(id, request, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }
}
