using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.Infrastructure.Services.Auth;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(IApplicationDbContext context, IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Validate if user email already exists in _context.Users
        // 2. Hash the user password (e.g., using BCrypt or ASP.NET PasswordHasher)
        // 3. Create and save new User entity to _context.Users
        // 4. Generate JWT token using _jwtTokenGenerator.GenerateToken(user)
        // 5. Return success response with AuthResponseDto

        await Task.CompletedTask;
        return ApiResponse<AuthResponseDto>.SuccessResponse(new AuthResponseDto
        {
            UserId = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Role = request.Role,
            TenantId = request.TenantId,
            Token = "PLACEHOLDER_JWT_TOKEN",
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        }, "Registration stub executed successfully.");
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Find user by email in _context.Users
        // 2. Verify hashed password
        // 3. Generate JWT token using _jwtTokenGenerator.GenerateToken(user)
        // 4. Return success response with AuthResponseDto

        await Task.CompletedTask;
        return ApiResponse<AuthResponseDto>.SuccessResponse(new AuthResponseDto
        {
            UserId = Guid.NewGuid(),
            Name = "Student Demo",
            Email = request.Email,
            Role = Domain.Enums.UserRole.Student,
            Token = "PLACEHOLDER_JWT_TOKEN",
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        }, "Login stub executed successfully.");
    }
}
