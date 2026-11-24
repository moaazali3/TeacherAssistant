using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.API.Configuration;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Tenants;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class TenantsController : BaseApiController
{
    private readonly ITenantManagementService _tenantService;

    public TenantsController(ITenantManagementService tenantService)
    {
        _tenantService = tenantService;
    }

    /// <summary>Checks whether a subdomain can be registered.</summary>
    [HttpGet("check-subdomain")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Public)]
    public async Task<ActionResult<ApiResponse<SubdomainAvailabilityDto>>> CheckSubdomain(
        [FromQuery] string? name,
        CancellationToken cancellationToken)
    {
        var response = await _tenantService.CheckSubdomainAsync(name ?? string.Empty, cancellationToken);
        return Ok(response);
    }

    /// <summary>Public branding for the resolved tenant, used by the frontend to theme itself.</summary>
    [HttpGet("current")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<TenantBrandingDto>>> GetCurrent(CancellationToken cancellationToken)
    {
        var response = await _tenantService.GetCurrentAsync(cancellationToken);
        return response.Success ? Ok(response) : NotFound(response);
    }

    /// <summary>Updates the branding of the resolved tenant. Instructors only.</summary>
    [HttpPut("current")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<TenantBrandingDto>>> UpdateCurrent(
        [FromBody] UpdateTenantBrandingDto request,
        CancellationToken cancellationToken)
    {
        var result = await _tenantService.UpdateCurrentAsync(request, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>Public landing page configuration for the resolved tenant.</summary>
    [HttpGet("current/landing")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LandingPageDto>>> GetLandingPage(CancellationToken cancellationToken)
    {
        var response = await _tenantService.GetLandingPageAsync(cancellationToken);
        return response.Success ? Ok(response) : NotFound(response);
    }

    /// <summary>Updates the landing page of the resolved tenant. Instructors only.</summary>
    [HttpPut("current/landing")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<LandingPageDto>>> UpdateLandingPage(
        [FromBody] LandingPageDto request,
        CancellationToken cancellationToken)
    {
        var result = await _tenantService.UpdateLandingPageAsync(request, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>Resets the landing page of the resolved tenant to default template. Instructors only.</summary>
    [HttpPost("current/landing/reset")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOnly)]
    public async Task<ActionResult<ApiResponse<LandingPageDto>>> ResetLandingPage(CancellationToken cancellationToken)
    {
        var result = await _tenantService.ResetLandingPageAsync(cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }
}
