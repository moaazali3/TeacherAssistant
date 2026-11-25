using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class LessonsController : BaseApiController
{
    private readonly ISubjectService _subjectService;

    public LessonsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    /// <summary>
    /// Full lesson (including ContentUrl). The owning instructor sees everything;
    /// a student must be a member of the subject and the lesson must be published.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<LessonDto>>> GetById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _subjectService.GetLessonAsync(id, cancellationToken));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<LessonDto>>> Update(
        [FromRoute] Guid id,
        [FromBody] UpdateLessonDto request,
        CancellationToken cancellationToken)
        => Map(await _subjectService.UpdateLessonAsync(id, request, cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _subjectService.DeleteLessonAsync(id, cancellationToken));

    [HttpPost("{id:guid}/complete")]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    public async Task<ActionResult<ApiResponse<LessonDto>>> MarkCompleted(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _subjectService.MarkLessonCompletedAsync(id, cancellationToken));

    private ActionResult<ApiResponse<T>> Map<T>(ServiceResult<T> result)
        => StatusCode(result.StatusCode, result.Response);
}
