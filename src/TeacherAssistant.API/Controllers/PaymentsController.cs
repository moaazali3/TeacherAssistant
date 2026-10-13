using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Payments;
using TeacherAssistant.Application.Interfaces;

namespace TeacherAssistant.API.Controllers;

public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>
    /// POST /api/v1/payments/checkout - بدء عملية الدفع لكورس
    /// </summary>
    [Authorize]
    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<CheckoutResponseDto>>> Checkout(
        [FromBody] CheckoutRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _paymentService.CheckoutAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// POST /api/v1/payments/webhook - استقبال تحديثات حالة الدفع من المزود الخارجي (Stripe / Fawry / Paymob)
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<ActionResult<ApiResponse<bool>>> HandleWebhook(
        [FromBody] PaymentWebhookDto webhookData,
        CancellationToken cancellationToken)
    {
        var response = await _paymentService.HandleWebhookAsync(webhookData, cancellationToken);
        return Ok(response);
    }
}
