using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Tenants;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Services.Tenancy;

public class TenantManagementService : ITenantManagementService
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;

    public TenantManagementService(
        IApplicationDbContext context,
        ITenantService tenantService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantService = tenantService;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<SubdomainAvailabilityDto>> CheckSubdomainAsync(
        string name,
        CancellationToken cancellationToken = default)
    {
        var subdomain = SubdomainRules.Normalize(name ?? string.Empty);

        if (!SubdomainRules.IsValidFormat(subdomain))
        {
            return ApiResponse<SubdomainAvailabilityDto>.SuccessResponse(
                new SubdomainAvailabilityDto
                {
                    Subdomain = subdomain,
                    Available = false,
                    Reason = "Subdomains must be 3-63 characters using lowercase letters, digits and inner hyphens."
                });
        }

        if (SubdomainRules.IsReserved(subdomain))
        {
            return ApiResponse<SubdomainAvailabilityDto>.SuccessResponse(
                new SubdomainAvailabilityDto
                {
                    Subdomain = subdomain,
                    Available = false,
                    Reason = "This subdomain is reserved."
                });
        }

        var exists = await _context.Tenants.AnyAsync(t => t.Subdomain == subdomain, cancellationToken);
        return ApiResponse<SubdomainAvailabilityDto>.SuccessResponse(
            new SubdomainAvailabilityDto
            {
                Subdomain = subdomain,
                Available = !exists,
                Reason = exists ? "This subdomain is already taken." : null
            });
    }

    public Task<ApiResponse<TenantBrandingDto>> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var tenant = _tenantService.Tenant;
        if (tenant is null)
        {
            return Task.FromResult(ApiResponse<TenantBrandingDto>.FailureResponse(
                "No tenant was resolved for this request."));
        }

        return Task.FromResult(ApiResponse<TenantBrandingDto>.SuccessResponse(Map(tenant)));
    }

    public async Task<ServiceResult<TenantBrandingDto>> UpdateCurrentAsync(
        UpdateTenantBrandingDto request,
        CancellationToken cancellationToken = default)
    {
        if (_tenantService.TenantId is not { } tenantId)
        {
            return ServiceResult<TenantBrandingDto>.Forbidden(
                "No tenant was resolved for this request.");
        }

        // The request tenant (X-Tenant/subdomain) and the tenant inside the caller's
        // JWT must be the same. Anything else is a cross-tenant branding attempt.
        if (_currentUserService.TenantId is not { } callerTenantId || callerTenantId != tenantId)
        {
            return ServiceResult<TenantBrandingDto>.Forbidden(
                "You can only update the branding of your own tenant.");
        }

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant is null)
        {
            return ServiceResult<TenantBrandingDto>.NotFound("Tenant not found.");
        }

        if (request.Name is not null)
        {
            var name = request.Name.Trim();
            if (name.Length < 2)
            {
                return ServiceResult<TenantBrandingDto>.BadRequest(
                    "The tenant name must be at least 2 characters.");
            }

            tenant.Name = name;
        }

        if (request.LogoUrl is not null)
            tenant.LogoUrl = NullIfWhiteSpace(request.LogoUrl);

        if (request.PrimaryColor is not null)
            tenant.PrimaryColor = NullIfWhiteSpace(request.PrimaryColor);

        if (request.Bio is not null)
            tenant.Bio = NullIfWhiteSpace(request.Bio);

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<TenantBrandingDto>.Ok(Map(tenant), "Branding updated successfully.");
    }

    public Task<ApiResponse<LandingPageDto>> GetLandingPageAsync(CancellationToken cancellationToken = default)
    {
        var tenant = _tenantService.Tenant;
        if (tenant is null)
        {
            return Task.FromResult(ApiResponse<LandingPageDto>.FailureResponse(
                "No tenant was resolved for this request."));
        }

        if (!string.IsNullOrWhiteSpace(tenant.LandingPageJson))
        {
            try
            {
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                var dto = System.Text.Json.JsonSerializer.Deserialize<LandingPageDto>(tenant.LandingPageJson, options);
                if (dto != null && dto.Sections != null && dto.Sections.Count > 0)
                {
                    if (tenant.PrimaryColor is not null && dto.Theme != null)
                    {
                        dto.Theme.PrimaryColor = tenant.PrimaryColor;
                    }
                    return Task.FromResult(ApiResponse<LandingPageDto>.SuccessResponse(dto));
                }
            }
            catch
            {
                // Fallback to default if stored JSON is corrupted
            }
        }

        var defaultDto = LandingPageRules.CreateDefault(tenant.Name, tenant.Bio, tenant.PrimaryColor, tenant.LogoUrl);
        return Task.FromResult(ApiResponse<LandingPageDto>.SuccessResponse(defaultDto));
    }

    public async Task<ServiceResult<LandingPageDto>> UpdateLandingPageAsync(
        LandingPageDto request,
        CancellationToken cancellationToken = default)
    {
        if (_tenantService.TenantId is not { } tenantId)
        {
            return ServiceResult<LandingPageDto>.Forbidden(
                "No tenant was resolved for this request.");
        }

        if (_currentUserService.TenantId is not { } callerTenantId || callerTenantId != tenantId)
        {
            return ServiceResult<LandingPageDto>.Forbidden(
                "You can only update the landing page of your own tenant.");
        }

        var errors = LandingPageRules.ValidateAndSanitize(request);
        if (errors.Count > 0)
        {
            return ServiceResult<LandingPageDto>.BadRequest("Validation failed.", errors);
        }

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant is null)
        {
            return ServiceResult<LandingPageDto>.NotFound("Tenant not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.Theme?.PrimaryColor))
        {
            tenant.PrimaryColor = request.Theme.PrimaryColor.Trim();
        }

        var options = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
        tenant.LandingPageJson = System.Text.Json.JsonSerializer.Serialize(request, options);

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<LandingPageDto>.Ok(request, "Landing page updated successfully.");
    }

    public async Task<ServiceResult<LandingPageDto>> ResetLandingPageAsync(CancellationToken cancellationToken = default)
    {
        if (_tenantService.TenantId is not { } tenantId)
        {
            return ServiceResult<LandingPageDto>.Forbidden(
                "No tenant was resolved for this request.");
        }

        if (_currentUserService.TenantId is not { } callerTenantId || callerTenantId != tenantId)
        {
            return ServiceResult<LandingPageDto>.Forbidden(
                "You can only update the landing page of your own tenant.");
        }

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant is null)
        {
            return ServiceResult<LandingPageDto>.NotFound("Tenant not found.");
        }

        tenant.LandingPageJson = null;
        await _context.SaveChangesAsync(cancellationToken);

        var defaultDto = LandingPageRules.CreateDefault(tenant.Name, tenant.Bio, tenant.PrimaryColor, tenant.LogoUrl);
        return ServiceResult<LandingPageDto>.Ok(defaultDto, "Landing page reset to defaults successfully.");
    }

    private static TenantBrandingDto Map(Tenant tenant) => new()
    {
        Id = tenant.Id,
        Name = tenant.Name,
        Subdomain = tenant.Subdomain,
        LogoUrl = tenant.LogoUrl,
        PrimaryColor = tenant.PrimaryColor,
        Bio = tenant.Bio
    };

    private static string? NullIfWhiteSpace(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
