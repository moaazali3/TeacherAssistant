using Microsoft.AspNetCore.Identity;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Services.Auth;

public class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string HashPassword(User user, string password)
        => _hasher.HashPassword(user, password);

    public bool VerifyPassword(User user, string hashedPassword, string password)
        => _hasher.VerifyHashedPassword(user, hashedPassword, password)
            is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
}
