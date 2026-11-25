using TeacherAssistant.Domain.Common;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Domain.Entities;

public class LessonPurchase : BaseEntity, ITenantEntity
{
    public Guid? TenantId { get; set; }

    public Guid StudentId { get; set; }
    public User? Student { get; set; }

    public Guid LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    public decimal Amount { get; set; }
    public string PaymentProvider { get; set; } = string.Empty; // Fawry, VodafoneCash, PaymobCard
    public string ReferenceCode { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime? PaidAt { get; set; }
}
