namespace TeacherAssistant.API.Configuration;

public class TenantResolutionOptions
{
    public const string SectionName = "TenantSettings";

    /// <summary>
    /// The platform's main domain, for example "ourplatform.com".
    /// Leave empty in local development, where *.localhost is handled automatically.
    /// </summary>
    public string? RootDomain { get; set; }
}
