namespace TeacherAssistant.Application.DTOs.Payments;

public class PaymentWebhookDto
{
    public string Provider { get; set; } = string.Empty; // Stripe, Fawry, Paymob
    public string EventType { get; set; } = string.Empty;
    public string TransactionReference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string RawPayload { get; set; } = string.Empty;
}
