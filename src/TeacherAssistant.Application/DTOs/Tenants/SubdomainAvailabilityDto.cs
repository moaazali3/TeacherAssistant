namespace TeacherAssistant.Application.DTOs.Tenants;

public class SubdomainAvailabilityDto
{
    public string Subdomain { get; set; } = string.Empty;
    public bool Available { get; set; }
    public string? Reason { get; set; }
}
