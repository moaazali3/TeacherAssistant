using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Auth;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Auth;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITenantService _tenantService;

    public AuthService(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        IPasswordHasher passwordHasher,
        ITenantService tenantService)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _passwordHasher = passwordHasher;
        _tenantService = tenantService;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterTeacherAsync(
        RegisterTeacherRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (_tenantService.HasTenant)
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "Teacher registration is only available on the platform domain.");
        }

        var subdomain = SubdomainRules.Normalize(request.Subdomain);
        if (SubdomainRules.IsReserved(subdomain))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse("This subdomain is reserved.");
        }

        if (!SubdomainRules.IsValidFormat(subdomain))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "Subdomains must be 3-63 characters using lowercase letters, digits and inner hyphens.");
        }

        if (await _context.Tenants.AnyAsync(t => t.Subdomain == subdomain, cancellationToken))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse("This subdomain is already taken.");
        }

        var email = NormalizeEmail(request.Email);

        // Platform accounts (TenantId == null) must not collide with a new teacher account.
        if (await _context.Users.AnyAsync(u => u.TenantId == null && u.Email == email, cancellationToken))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse("An account with this email already exists.");
        }

        var tenant = new Tenant
        {
            Name = string.IsNullOrWhiteSpace(request.TenantName) ? request.Name.Trim() : request.TenantName.Trim(),
            Subdomain = subdomain,
            LogoUrl = NullIfWhiteSpace(request.LogoUrl),
            PrimaryColor = NullIfWhiteSpace(request.PrimaryColor),
            Bio = NullIfWhiteSpace(request.Bio)
        };

        var instructor = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            Role = UserRole.Instructor,
            TenantId = tenant.Id
        };
        instructor.PasswordHash = _passwordHasher.HashPassword(instructor, request.Password);

        // Both entities are written by a single SaveChanges call, which EF wraps in a transaction.
        _context.Tenants.Add(tenant);
        _context.Users.Add(instructor);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AuthResponseDto>.SuccessResponse(
            BuildAuthResponse(instructor, tenant.Subdomain),
            "Teacher account created successfully.");
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterStudentAsync(
        RegisterStudentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "Student registration requires a tenant subdomain.");
        }

        var email = NormalizeEmail(request.Email);
        var phoneNumber = request.PhoneNumber.Trim();
        var parentPhoneNumber = request.ParentPhoneNumber.Trim();

        if (string.Equals(phoneNumber, parentPhoneNumber, StringComparison.Ordinal))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "رقم هاتف ولي الأمر يجب أن يكون مختلفاً عن رقم الطالب.");
        }

        var minBirthDate = new DateOnly(1950, 1, 1);
        var maxBirthDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-6));
        if (request.DateOfBirth is null || request.DateOfBirth < minBirthDate || request.DateOfBirth > maxBirthDate)
        {
            return ApiResponse<AuthResponseDto>.FailureResponse("تاريخ الميلاد غير صالح.");
        }

        // The global tenant filter keeps this check inside the current platform.
        if (await _context.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "An account with this email already exists in this platform.");
        }

        // Students cannot self-register freely: the teacher's group code places them in a group.
        var code = JoinCodeRules.Normalize(request.JoinCode);
        var group = await _context.Groups
            .Include(g => g.Subject)
            .FirstOrDefaultAsync(g => g.JoinCode == code, cancellationToken);

        if (group is null || group.Subject is null)
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "Invalid join code. Ask your teacher for the correct group code.");
        }

        if (!group.IsCodeActive)
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "This join code is no longer active. Ask your teacher for a new code.");
        }

        if (!group.IsOpen)
        {
            return ApiResponse<AuthResponseDto>.FailureResponse(
                "This group is not accepting new students.");
        }

        var student = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PhoneNumber = phoneNumber,
            ParentPhoneNumber = parentPhoneNumber,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            Role = UserRole.Student,
            TenantId = _tenantService.TenantId
        };
        student.PasswordHash = _passwordHasher.HashPassword(student, request.Password);

        var membership = new GroupMembership
        {
            GroupId = group.Id,
            SubjectId = group.SubjectId,
            StudentId = student.Id,
            TenantId = _tenantService.TenantId
        };

        // Both rows are written by one SaveChanges call, which EF wraps in a transaction.
        _context.Users.Add(student);
        _context.GroupMemberships.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AuthResponseDto>.SuccessResponse(
            BuildAuthResponse(student, _tenantService.Subdomain),
            "Student account created successfully.");
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var currentTenantId = _tenantService.TenantId;

        // Platform login (currentTenantId is null) permits platform Admins (TenantId == null),
        // Instructors, and Assistants (who manage their teacher's platform from the control panel).
        // Tenant login (currentTenantId is not null) restricts login to users of that tenant.
        var user = currentTenantId is null
            ? await _context.Users.FirstOrDefaultAsync(
                u => (u.TenantId == null || u.Role == UserRole.Instructor || u.Role == UserRole.Assistant)
                    && u.Email == email, cancellationToken)
            : await _context.Users.FirstOrDefaultAsync(
                u => u.TenantId == currentTenantId && u.Email == email, cancellationToken);

        if (user is null || !_passwordHasher.VerifyPassword(user, user.PasswordHash, request.Password))
        {
            return ApiResponse<AuthResponseDto>.FailureResponse("Invalid email or password.");
        }

        var tenantSubdomain = _tenantService.Subdomain;
        if (tenantSubdomain is null && user.TenantId is not null)
        {
            tenantSubdomain = await _context.Tenants
                .Where(t => t.Id == user.TenantId)
                .Select(t => t.Subdomain)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return ApiResponse<AuthResponseDto>.SuccessResponse(
            BuildAuthResponse(user, tenantSubdomain),
            "Login successful.");
    }

    private AuthResponseDto BuildAuthResponse(User user, string? tenantSubdomain)
    {
        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            Permissions = user.Role == UserRole.Instructor ? AssistantPermissions.All : user.Permissions,
            TenantId = user.TenantId,
            TenantSubdomain = tenantSubdomain,
            Token = token.Token,
            ExpiresAt = token.ExpiresAt
        };
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string? NullIfWhiteSpace(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
