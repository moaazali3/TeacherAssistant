using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Assistants;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Services.Assistants;

public class AssistantService : IAssistantService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;
    private readonly IPasswordHasher _passwordHasher;

    public AssistantService(
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

    public async Task<ServiceResult<IReadOnlyList<AssistantDto>>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        if (!IsInstructor())
            return ServiceResult<IReadOnlyList<AssistantDto>>.Forbidden();

        if (!HasTenant)
            return ServiceResult<IReadOnlyList<AssistantDto>>.NotFound("No tenant was resolved for this request.");

        var assistants = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Assistant)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AssistantDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                Permissions = u.Permissions,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return ServiceResult<IReadOnlyList<AssistantDto>>.Ok(assistants, "Assistants fetched successfully.");
    }

    public async Task<ServiceResult<AssistantDto>> CreateAsync(
        CreateAssistantDto request,
        CancellationToken cancellationToken = default)
    {
        if (!IsInstructor())
            return ServiceResult<AssistantDto>.Forbidden();

        if (!HasTenant)
            return ServiceResult<AssistantDto>.NotFound("No tenant was resolved for this request.");

        var email = request.Email.Trim().ToLowerInvariant();

        // Check both within the current tenant and across staff/platform accounts so platform login never collides.
        var emailExistsInTenant = await _context.Users
            .AnyAsync(u => u.Email == email, cancellationToken);
        if (emailExistsInTenant)
            return ServiceResult<AssistantDto>.Conflict("يوجد حساب بنفس البريد الإلكتروني في هذه المنصة بالفعل.");

        var emailExistsGloballyForStaff = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == email && u.Role != UserRole.Student, cancellationToken);
        if (emailExistsGloballyForStaff)
            return ServiceResult<AssistantDto>.Conflict("هذا البريد الإلكتروني مستخدم بالفعل لحساب إدارة أو معلم آخر.");

        var assistant = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            Role = UserRole.Assistant,
            Permissions = request.Permissions,
            TenantId = _tenantService.TenantId
        };
        assistant.PasswordHash = _passwordHasher.HashPassword(assistant, request.Password);

        _context.Users.Add(assistant);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<AssistantDto>.Created(new AssistantDto
        {
            Id = assistant.Id,
            Name = assistant.Name,
            Email = assistant.Email,
            PhoneNumber = assistant.PhoneNumber,
            Permissions = assistant.Permissions,
            CreatedAt = assistant.CreatedAt
        }, "Assistant created successfully.");
    }

    public async Task<ServiceResult<AssistantDto>> UpdatePermissionsAsync(
        Guid assistantId,
        UpdateAssistantPermissionsDto request,
        CancellationToken cancellationToken = default)
    {
        if (!IsInstructor())
            return ServiceResult<AssistantDto>.Forbidden();

        if (!HasTenant)
            return ServiceResult<AssistantDto>.NotFound("No tenant was resolved for this request.");

        var assistant = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == assistantId && u.Role == UserRole.Assistant, cancellationToken);

        if (assistant is null)
            return ServiceResult<AssistantDto>.NotFound("Assistant not found in this tenant.");

        assistant.Permissions = request.Permissions;
        assistant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<AssistantDto>.Ok(new AssistantDto
        {
            Id = assistant.Id,
            Name = assistant.Name,
            Email = assistant.Email,
            PhoneNumber = assistant.PhoneNumber,
            Permissions = assistant.Permissions,
            CreatedAt = assistant.CreatedAt
        }, "Assistant permissions updated successfully.");
    }

    public async Task<ServiceResult<string>> DeleteAsync(
        Guid assistantId,
        CancellationToken cancellationToken = default)
    {
        if (!IsInstructor())
            return ServiceResult<string>.Forbidden();

        if (!HasTenant)
            return ServiceResult<string>.NotFound("No tenant was resolved for this request.");

        var assistant = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == assistantId && u.Role == UserRole.Assistant, cancellationToken);

        if (assistant is null)
            return ServiceResult<string>.NotFound("Assistant not found in this tenant.");

        _context.Users.Remove(assistant);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<string>.Ok(assistantId.ToString(), "Assistant removed successfully.");
    }

    private bool HasTenant => _tenantService.HasTenant && _tenantService.TenantId is not null;

    private bool IsInstructor()
        => _currentUserService.UserId is not null
        && _currentUserService.UserId != Guid.Empty
        && string.Equals(_currentUserService.Role, nameof(UserRole.Instructor), StringComparison.Ordinal);
}
