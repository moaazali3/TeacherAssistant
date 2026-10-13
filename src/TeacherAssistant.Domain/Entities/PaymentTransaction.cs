using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class PaymentTransaction : BaseEntity
{
    public Guid EnrollmentId { get; set; }
    public Enrollment? Enrollment { get; set; }

    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string TransactionRef { get; set; } = string.Empty;
    public string PaymentProvider { get; set; } = string.Empty; // e.g. Stripe, Fawry, Paymob
    public DateTime? PaidAt { get; set; }
}
