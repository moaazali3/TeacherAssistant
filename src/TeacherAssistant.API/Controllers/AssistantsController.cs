using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Assistants;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

[Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
public class AssistantsController : BaseApiController
{
    private readonly IAssistantService _assistantService;

    public AssistantsController(IAssistantService assistantService)
    {
        _assistantService = assistantService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssistantDto>>>> GetAll(
        CancellationToken cancellationToken)
    {
        var result = await _assistantService.GetAllAsync(cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AssistantDto>>> Create(
        [FromBody] CreateAssistantDto request,
        CancellationToken cancellationToken)
    {
        var result = await _assistantService.CreateAsync(request, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    [HttpPut("{id:guid}/permissions")]
    public async Task<ActionResult<ApiResponse<AssistantDto>>> UpdatePermissions(
        [FromRoute] Guid id,
        [FromBody] UpdateAssistantPermissionsDto request,
        CancellationToken cancellationToken)
    {
        var result = await _assistantService.UpdatePermissionsAsync(id, request, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _assistantService.DeleteAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }
}
