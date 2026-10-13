using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Payments;

namespace TeacherAssistant.Application.Interfaces;

public interface IPaymentService
{
    Task<ApiResponse<CheckoutResponseDto>> CheckoutAsync(CheckoutRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> HandleWebhookAsync(PaymentWebhookDto webhookData, CancellationToken cancellationToken = default);
}
