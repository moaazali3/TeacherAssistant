using Microsoft.Extensions.Options;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Payments;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Infrastructure.Settings;

namespace TeacherAssistant.Infrastructure.Services.Payments;

public class PaymentService : IPaymentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly PaymentSettings _paymentSettings;

    public PaymentService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IOptions<PaymentSettings> paymentOptions)
    {
        _context = context;
        _currentUserService = currentUserService;
        _paymentSettings = paymentOptions.Value;
    }

    public async Task<ApiResponse<CheckoutResponseDto>> CheckoutAsync(CheckoutRequestDto request, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Fetch subject details and student info
        // 2. Create pending Enrollment record
        // 3. Initiate payment session via Stripe Checkout API, Fawry API, or Paymob API
        // 4. Return checkout session URL to redirect student
        await Task.CompletedTask;
        return ApiResponse<CheckoutResponseDto>.SuccessResponse(new CheckoutResponseDto
        {
            CheckoutUrl = "https://checkout.stripe.com/pay/cs_test_sample",
            SessionId = "cs_test_sample_session_id",
            EnrollmentId = Guid.NewGuid()
        }, "Checkout session created stub.");
    }

    public async Task<ApiResponse<bool>> HandleWebhookAsync(PaymentWebhookDto webhookData, CancellationToken cancellationToken = default)
    {
        // TODO (Graduation Project Team):
        // 1. Verify webhook signature (Stripe-Signature / HMAC)
        // 2. Parse payment status (e.g. payment_intent.succeeded)
        // 3. Update Enrollment status to Active
        // 4. Record PaymentTransaction entity in _context.PaymentTransactions
        await Task.CompletedTask;
        return ApiResponse<bool>.SuccessResponse(true, "Webhook processed successfully stub.");
    }
}
