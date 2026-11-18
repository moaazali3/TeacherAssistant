namespace TeacherAssistant.API.Configuration;

public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>Set to false (for example in tests) to bypass every policy.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Login attempts per client IP + email combination.</summary>
    public RateLimitRuleOptions Login { get; set; } = new() { PermitLimit = 5, WindowMinutes = 1 };

    /// <summary>Join-code attempts per client IP (register-student and groups/join).</summary>
    public RateLimitRuleOptions JoinCode { get; set; } = new() { PermitLimit = 10, WindowMinutes = 10 };

    /// <summary>Loose per-IP limit for public endpoints such as register-teacher and check-subdomain.</summary>
    public RateLimitRuleOptions Public { get; set; } = new() { PermitLimit = 20, WindowMinutes = 10 };
}

public sealed class RateLimitRuleOptions
{
    public int PermitLimit { get; set; }
    public int WindowMinutes { get; set; }
    public int QueueLimit { get; set; }
}
