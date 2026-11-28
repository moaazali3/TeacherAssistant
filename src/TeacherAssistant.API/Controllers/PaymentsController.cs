using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
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

    /// <summary>Initiate a mock payment session (Fawry / VodafoneCash / PaymobCard) for a paid lesson.</summary>
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpPost("lessons/{lessonId:guid}/initiate")]
    public async Task<ActionResult<ApiResponse<LessonPaymentSessionDto>>> InitiateLessonPayment(
        [FromRoute] Guid lessonId,
        [FromBody] InitiateLessonPaymentDto request,
        CancellationToken cancellationToken)
    {
        var result = await _paymentService.InitiateLessonPaymentAsync(lessonId, request, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>Confirm a pending mock payment and immediately unlock the lesson.</summary>
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpPost("purchases/{purchaseId:guid}/confirm-mock")]
    public async Task<ActionResult<ApiResponse<LessonPaymentSessionDto>>> ConfirmMockPurchase(
        [FromRoute] Guid purchaseId,
        CancellationToken cancellationToken)
    {
        var result = await _paymentService.ConfirmMockPurchaseAsync(purchaseId, cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>List the logged-in student's lesson purchases.</summary>
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpGet("my-purchases")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LessonPaymentSessionDto>>>> GetMyPurchases(
        CancellationToken cancellationToken)
    {
        var result = await _paymentService.GetMyPurchasesAsync(cancellationToken);
        return StatusCode(result.StatusCode, result.Response);
    }

    /// <summary>
    /// POST /api/v1/payments/checkout - بدء عملية الدفع لمادة
    /// </summary>
    [Authorize]
    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<CheckoutResponseDto>>> Checkout(
        [FromBody] CheckoutRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _paymentService.CheckoutAsync(request, cancellationToken);
        return response.Success ? Ok(response) : BadRequest(response);
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
        return response.Success ? Ok(response) : BadRequest(response);
    }
}
