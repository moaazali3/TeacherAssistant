namespace TeacherAssistant.Application.DTOs.Tenants;

public class TenantBrandingDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
    public string? Bio { get; set; }
}
