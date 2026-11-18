using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TeacherAssistant.API.Configuration;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Creates a tenant and its Instructor account. Platform domain only.</summary>
    [HttpPost("register-teacher")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Public)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RegisterTeacher(
        [FromBody] RegisterTeacherRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterTeacherAsync(request, cancellationToken);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    /// <summary>Creates a Student inside the resolved tenant. Requires an X-Tenant header or tenant subdomain.</summary>
    [HttpPost("register-student")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.JoinCode)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RegisterStudent(
        [FromBody] RegisterStudentRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterStudentAsync(request, cancellationToken);
        return response.Success ? Ok(response) : BadRequest(response);
    }

    /// <summary>Logs in against the resolved tenant (platform admins log in on the main domain).</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        return response.Success ? Ok(response) : Unauthorized(response);
    }
}
