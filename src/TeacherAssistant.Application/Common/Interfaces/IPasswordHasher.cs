using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string HashPassword(User user, string password);
    bool VerifyPassword(User user, string hashedPassword, string password);
}
