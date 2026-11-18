using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    JwtTokenResult GenerateToken(User user);
}
