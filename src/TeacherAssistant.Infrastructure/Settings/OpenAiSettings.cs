namespace TeacherAssistant.Infrastructure.Settings;

public class OpenAiSettings
{
    public const string SectionName = "OpenAiSettings";

    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-4o-mini";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
}
