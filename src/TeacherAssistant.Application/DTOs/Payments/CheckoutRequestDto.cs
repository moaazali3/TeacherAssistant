namespace TeacherAssistant.Application.DTOs.Payments;

public class CheckoutRequestDto
{
    public Guid CourseId { get; set; }
    public string PaymentProvider { get; set; } = "Stripe"; // Stripe, Fawry, Paymob
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}
