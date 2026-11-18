using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Tenants;

namespace TeacherAssistant.Application.Interfaces;

public interface ITenantManagementService
{
    Task<ApiResponse<SubdomainAvailabilityDto>> CheckSubdomainAsync(string name, CancellationToken cancellationToken = default);
    Task<ApiResponse<TenantBrandingDto>> GetCurrentAsync(CancellationToken cancellationToken = default);
    Task<ServiceResult<TenantBrandingDto>> UpdateCurrentAsync(UpdateTenantBrandingDto request, CancellationToken cancellationToken = default);
}
