using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Payments;

namespace TeacherAssistant.Application.Interfaces;

public interface IPaymentService
{
    Task<ApiResponse<CheckoutResponseDto>> CheckoutAsync(CheckoutRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> HandleWebhookAsync(PaymentWebhookDto webhookData, CancellationToken cancellationToken = default);

    Task<ServiceResult<LessonPaymentSessionDto>> InitiateLessonPaymentAsync(
        Guid lessonId, InitiateLessonPaymentDto request, CancellationToken cancellationToken = default);

    Task<ServiceResult<LessonPaymentSessionDto>> ConfirmMockPurchaseAsync(
        Guid purchaseId, CancellationToken cancellationToken = default);

    Task<ServiceResult<IReadOnlyList<LessonPaymentSessionDto>>> GetMyPurchasesAsync(
        CancellationToken cancellationToken = default);
}
