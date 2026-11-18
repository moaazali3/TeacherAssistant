using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Students;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Students;

public class StudentService : IStudentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;
    private readonly IPasswordHasher _passwordHasher;

    public StudentService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITenantService tenantService,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tenantService = tenantService;
        _passwordHasher = passwordHasher;
    }

    public async Task<ServiceResult<string>> ResetPasswordAsync(
        Guid studentId,
        ResetStudentPasswordDto request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetInstructorId(out _))
            return ServiceResult<string>.Forbidden();

        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<string>.NotFound("No tenant was resolved for this request.");

        // The global tenant filter keeps this lookup inside the caller's tenant.
        var student = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == studentId && u.Role == UserRole.Student, cancellationToken);

        if (student is null)
            return ServiceResult<string>.NotFound("Student not found in this tenant.");

        student.PasswordHash = _passwordHasher.HashPassword(student, request.NewPassword);
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(studentId.ToString(), "Student password reset successfully.");
    }

    private bool TryGetInstructorId(out Guid instructorId)
    {
        instructorId = _currentUserService.UserId ?? Guid.Empty;
        return instructorId != Guid.Empty
            && string.Equals(_currentUserService.Role, nameof(UserRole.Instructor), StringComparison.Ordinal);
    }
}
