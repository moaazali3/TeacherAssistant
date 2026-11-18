namespace TeacherAssistant.Infrastructure.Settings;

public class SeedSettings
{
    public const string SectionName = "Seed";

    /// <summary>
    /// Explicit flag to allow seeding demo data when not in development mode (e.g. staging or integration tests).
    /// </summary>
    public bool DemoData { get; set; } = false;

    public string AdminName { get; set; } = "Platform Admin";
    public string AdminEmail { get; set; } = "admin@platform.local";
    public string AdminPassword { get; set; } = "Admin@12345";

    public string DemoTenantName { get; set; } = "Demo Academy";
    public string DemoSubdomain { get; set; } = "demo";
    public string DemoTeacherName { get; set; } = "Demo Teacher";
    public string DemoTeacherEmail { get; set; } = "teacher@demo.local";
    public string DemoTeacherPassword { get; set; } = "Demo@12345";
    public string? DemoPrimaryColor { get; set; } = "#0F766E";
    public string? DemoBio { get; set; } = "A demo teacher platform for testing.";

    public string DemoSubjectTitle { get; set; } = "كيمياء - تالتة ثانوي";
    public string DemoSubjectDescription { get; set; } = "شرح منهج الكيمياء للثانوية العامة، يشمل الكيمياء العضوية والتحليلية والاتزان الكيميائي والكهربية.";

    public string DemoGroupOneName { get; set; } = "مجموعة السبت 5 مساءً";
    public string DemoGroupOneCode { get; set; } = "SAT5CHEM";
    public string? DemoGroupOneSchedule { get; set; } = "السبت من 5:00 إلى 7:00 مساءً";

    public string DemoGroupTwoName { get; set; } = "مجموعة الإثنين 7 مساءً";
    public string DemoGroupTwoCode { get; set; } = "MND7CHEM";
    public string? DemoGroupTwoSchedule { get; set; } = "الإثنين من 7:00 إلى 9:00 مساءً";
}
