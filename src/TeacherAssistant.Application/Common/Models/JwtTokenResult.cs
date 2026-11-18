namespace TeacherAssistant.Application.Common.Models;

public sealed record JwtTokenResult(string Token, DateTime ExpiresAt);
