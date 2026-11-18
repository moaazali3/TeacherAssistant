using TeacherAssistant.Domain.Common;

namespace TeacherAssistant.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Unique, lowercase subdomain (for example "ahmed").</summary>
    public string Subdomain { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? Bio { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<User> Users { get; set; } = new List<User>();
}
