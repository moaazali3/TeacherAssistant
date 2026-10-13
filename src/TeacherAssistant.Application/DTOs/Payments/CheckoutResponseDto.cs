namespace TeacherAssistant.Application.DTOs.Payments;

public class CheckoutResponseDto
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public Guid EnrollmentId { get; set; }
}
