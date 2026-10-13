namespace TeacherAssistant.Infrastructure.Settings;

public class PaymentSettings
{
    public const string SectionName = "PaymentSettings";

    public string StripeSecretKey { get; set; } = string.Empty;
    public string StripeWebhookSecret { get; set; } = string.Empty;
    public string FawryMerchantCode { get; set; } = string.Empty;
    public string FawrySecurityKey { get; set; } = string.Empty;
    public string PaymobApiKey { get; set; } = string.Empty;
    public string PaymobHmacSecret { get; set; } = string.Empty;
}
