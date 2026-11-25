using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Assistants;

namespace TeacherAssistant.Application.Interfaces;

public interface IAssistantService
{
    Task<ServiceResult<IReadOnlyList<AssistantDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ServiceResult<AssistantDto>> CreateAsync(CreateAssistantDto request, CancellationToken cancellationToken = default);
    Task<ServiceResult<AssistantDto>> UpdatePermissionsAsync(
        Guid assistantId, UpdateAssistantPermissionsDto request, CancellationToken cancellationToken = default);
    Task<ServiceResult<string>> DeleteAsync(Guid assistantId, CancellationToken cancellationToken = default);
}
