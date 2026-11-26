using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Subjects;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

/// <summary>
/// Subject management for the logged-in instructor and read access for students.
/// </summary>
[Route("api/v1/subjects")]
public class SubjectsController : BaseApiController
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    /// <summary>All subjects owned by the logged-in instructor, drafts included.</summary>
    [HttpGet("mine")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SubjectSummaryDto>>>> GetMine(
        CancellationToken cancellationToken)
        => Map(await _subjectService.GetMySubjectsAsync(cancellationToken));

    /// <summary>Published subjects of the current tenant (students only see joined subjects).</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SubjectSummaryDto>>>> GetAll(
        CancellationToken cancellationToken)
        => Map(await _subjectService.GetSubjectsAsync(cancellationToken));

    /// <summary>
    /// Published subjects in the same grade level as the student's enrolled subjects that they have not joined yet.
    /// </summary>
    [HttpGet("same-grade-available")]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SubjectSummaryDto>>>> GetSameGradeAvailable(
        CancellationToken cancellationToken)
        => Map(await _subjectService.GetSameGradeAvailableSubjectsAsync(cancellationToken));

    /// <summary>
    /// Published subject with its published lessons (no ContentUrl).
    /// The owning instructor also sees drafts; students must be group members.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SubjectDetailDto>>> GetById(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _subjectService.GetSubjectDetailAsync(id, cancellationToken));

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<SubjectSummaryDto>>> Create(
        [FromBody] CreateSubjectDto request,
        CancellationToken cancellationToken)
        => Map(await _subjectService.CreateSubjectAsync(request, cancellationToken));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<SubjectDetailDto>>> Update(
        [FromRoute] Guid id,
        [FromBody] UpdateSubjectDto request,
        CancellationToken cancellationToken)
        => Map(await _subjectService.UpdateSubjectAsync(id, request, cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
        => Map(await _subjectService.DeleteSubjectAsync(id, cancellationToken));

    [HttpPost("{id:guid}/lessons")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<LessonDto>>> AddLesson(
        [FromRoute] Guid id,
        [FromBody] CreateLessonDto request,
        CancellationToken cancellationToken)
        => Map(await _subjectService.AddLessonAsync(id, request, cancellationToken));

    [HttpPut("{id:guid}/lessons/reorder")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonSummaryDto>>>> ReorderLessons(
        [FromRoute] Guid id,
        [FromBody] ReorderLessonsDto request,
        CancellationToken cancellationToken)
        => Map(await _subjectService.ReorderLessonsAsync(id, request, cancellationToken));

    private ActionResult<ApiResponse<T>> Map<T>(ServiceResult<T> result)
        => StatusCode(result.StatusCode, result.Response);
}
