using System.Text.Json.Nodes;

namespace TeacherAssistant.Application.DTOs.Tenants;

public class LandingPageDto
{
    public int Version { get; set; } = 1;
    public LandingThemeDto Theme { get; set; } = new();
    public List<LandingSectionDto> Sections { get; set; } = new();
}

public class LandingThemeDto
{
    public string PrimaryColor { get; set; } = "#0F766E";
    public string SecondaryColor { get; set; } = "#0D9488";
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string TextColor { get; set; } = "#0F172A";
    public string FontFamily { get; set; } = "Cairo";
    public string BorderRadius { get; set; } = "xl";
    public string ButtonStyle { get; set; } = "solid";
    public string? HeroImageUrl { get; set; }
}

public class LandingSectionDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public string Variant { get; set; } = string.Empty;
    public JsonNode? Content { get; set; }
}
