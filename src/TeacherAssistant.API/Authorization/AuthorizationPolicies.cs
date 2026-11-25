namespace TeacherAssistant.API.Authorization;

public static class AuthorizationPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string InstructorOnly = "InstructorOnly";
    public const string InstructorOrAssistant = "InstructorOrAssistant";
    public const string StudentOnly = "StudentOnly";
}
