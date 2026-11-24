using System.Net;
using Microsoft.Extensions.Options;
using TeacherAssistant.API.Configuration;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;

namespace TeacherAssistant.API.Middlewares;

/// <summary>
/// Resolves the tenant for the request. Priority:
/// 1. The X-Tenant header (subdomain slug), which the frontend always sends.
/// 2. The first label of the Host header (for example "ahmed" from ahmed.ourplatform.com).
/// When neither is present the request is platform-level and no tenant is set.
/// </summary>
public class TenantResolutionMiddleware
{
    public const string TenantHeaderName = "X-Tenant";

    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;
    private readonly TenantResolutionOptions _options;

    public TenantResolutionMiddleware(
        RequestDelegate next,
        ILogger<TenantResolutionMiddleware> logger,
        IOptions<TenantResolutionOptions> options)
    {
        _next = next;
        _logger = logger;
        _options = options.Value;
    }

    public async Task InvokeAsync(
        HttpContext context,
        ITenantRepository tenantRepository,
        ITenantContextSetter tenantContext)
    {
        var headerValue = context.Request.Headers[TenantHeaderName].FirstOrDefault();
        var identifier = string.IsNullOrWhiteSpace(headerValue)
            ? GetSubdomainFromHost(context.Request.Host.Host)
            : headerValue.Trim();

        if (string.IsNullOrWhiteSpace(identifier))
        {
            await _next(context);
            return;
        }

        var subdomain = identifier.ToLowerInvariant();

        var tenant = await tenantRepository.GetBySubdomainAsync(subdomain, context.RequestAborted);
        if (tenant is null || !tenant.IsActive)
        {
            // Allow non-API requests (e.g. SPA navigation) to fall through to the frontend router
            if (!context.Request.Path.StartsWithSegments("/api"))
            {
                await _next(context);
                return;
            }

            _logger.LogWarning("Tenant resolution failed for '{Identifier}' (active: {Active}).",
                subdomain, tenant?.IsActive);

            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            await context.Response.WriteAsJsonAsync(
                ApiResponse<string>.FailureResponse($"No active tenant was found for '{subdomain}'."),
                context.RequestAborted);
            return;
        }

        tenantContext.SetTenant(tenant);
        await _next(context);
    }

    private string? GetSubdomainFromHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host) || IPAddress.TryParse(host, out _))
            return null;

        var normalizedHost = host.ToLowerInvariant().TrimEnd('.');

        // Production: only hosts below the configured root domain carry a tenant.
        var rootDomain = _options.RootDomain?.Trim().Trim('.').ToLowerInvariant();
        if (!string.IsNullOrEmpty(rootDomain))
        {
            if (normalizedHost == rootDomain || normalizedHost == $"www.{rootDomain}")
                return null;

            var suffix = $".{rootDomain}";
            return normalizedHost.EndsWith(suffix)
                ? normalizedHost[..^suffix.Length]
                : null;
        }

        var labels = normalizedHost.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (labels.Length < 2)
            return null;

        // Development: "demo.localhost" is a tenant, "localhost" is the platform.
        if (labels.Length == 2)
            return labels[1] == "localhost" ? labels[0] : null;

        // Fallback without configuration: ahmed.ourplatform.com -> ahmed.
        // The marketing site (www) is not a tenant.
        return labels[0] == "www" ? null : labels[0];
    }
}
