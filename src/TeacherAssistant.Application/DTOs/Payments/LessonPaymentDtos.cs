using System.ComponentModel.DataAnnotations;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Application.DTOs.Payments;

public class InitiateLessonPaymentDto
{
    /// <summary>Fawry, VodafoneCash, or PaymobCard.</summary>
    [Required(ErrorMessage = "يرجى اختيار وسيلة الدفع.")]
    [StringLength(50)]
    public string Provider { get; set; } = "Fawry";

    [StringLength(20)]
    public string? WalletPhone { get; set; }
}

public class LessonPaymentSessionDto
{
    public Guid PurchaseId { get; set; }
    public Guid LessonId { get; set; }
    public string LessonTitle { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ReferenceCode { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public bool IsMockMode { get; set; } = true;
}
