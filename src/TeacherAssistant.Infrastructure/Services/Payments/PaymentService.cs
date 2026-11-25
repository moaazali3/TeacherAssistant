using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Application.DTOs.Payments;
using TeacherAssistant.Application.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;
using TeacherAssistant.Infrastructure.Settings;

namespace TeacherAssistant.Infrastructure.Services.Payments;

public class PaymentService : IPaymentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;
    private readonly PaymentSettings _paymentSettings;

    public PaymentService(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        ITenantService tenantService,
        IOptions<PaymentSettings> paymentOptions)
    {
        _context = context;
        _currentUserService = currentUserService;
        _tenantService = tenantService;
        _paymentSettings = paymentOptions.Value;
    }

    public async Task<ServiceResult<LessonPaymentSessionDto>> InitiateLessonPaymentAsync(
        Guid lessonId,
        InitiateLessonPaymentDto request,
        CancellationToken cancellationToken = default)
    {
        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<LessonPaymentSessionDto>.NotFound("No tenant was resolved for this request.");

        if (_currentUserService.UserId is not { } studentId ||
            !string.Equals(_currentUserService.Role, nameof(UserRole.Student), StringComparison.Ordinal))
        {
            return ServiceResult<LessonPaymentSessionDto>.Forbidden("Only students can purchase lessons.");
        }

        var canonicalProvider = NormalizeProvider(request.Provider);
        if (canonicalProvider is null)
        {
            return ServiceResult<LessonPaymentSessionDto>.BadRequest(
                "وسيلة الدفع غير مدعومة. اختر Fawry أو VodafoneCash أو PaymobCard.");
        }

        var lesson = await _context.Lessons
            .AsNoTracking()
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);

        if (lesson is null || lesson.Subject is null || !lesson.Subject.IsPublished || !lesson.IsPublished)
            return ServiceResult<LessonPaymentSessionDto>.NotFound("Lesson not found.");

        var isMember = await _context.GroupMemberships
            .AnyAsync(m => m.SubjectId == lesson.SubjectId && m.StudentId == studentId, cancellationToken);

        if (!isMember)
            return ServiceResult<LessonPaymentSessionDto>.Forbidden("يجب الانضمام إلى مجموعة في هذه المادة أولاً.");

        if (lesson.Price <= 0)
            return ServiceResult<LessonPaymentSessionDto>.BadRequest("هذه المحاضرة مجانية ولا تتطلب شراء.");

        var alreadyPurchased = await _context.LessonPurchases
            .AnyAsync(
                lp => lp.StudentId == studentId && lp.LessonId == lessonId && lp.Status == PaymentStatus.Completed,
                cancellationToken);

        if (alreadyPurchased)
            return ServiceResult<LessonPaymentSessionDto>.Conflict("لقد قمت بشراء هذه المحاضرة بالفعل.");

        var referenceCode = canonicalProvider switch
        {
            "Fawry" => $"98{Random.Shared.Next(10000000, 99999999)}",
            "VodafoneCash" => $"VF-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            _ => $"PM-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
        };

        var purchase = new LessonPurchase
        {
            StudentId = studentId,
            LessonId = lesson.Id,
            Amount = lesson.Price,
            PaymentProvider = canonicalProvider,
            ReferenceCode = referenceCode,
            Status = PaymentStatus.Pending
        };

        _context.LessonPurchases.Add(purchase);
        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<LessonPaymentSessionDto>.Ok(
            BuildSessionDto(purchase, lesson.Title),
            "تم إنشاء طلب الدفع التجريبي بنجاح.");
    }

    public async Task<ServiceResult<LessonPaymentSessionDto>> ConfirmMockPurchaseAsync(
        Guid purchaseId,
        CancellationToken cancellationToken = default)
    {
        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<LessonPaymentSessionDto>.NotFound("No tenant was resolved for this request.");

        if (_currentUserService.UserId is not { } studentId ||
            !string.Equals(_currentUserService.Role, nameof(UserRole.Student), StringComparison.Ordinal))
        {
            return ServiceResult<LessonPaymentSessionDto>.Forbidden("Only students can confirm purchases.");
        }

        var purchase = await _context.LessonPurchases
            .Include(lp => lp.Lesson)
            .FirstOrDefaultAsync(lp => lp.Id == purchaseId && lp.StudentId == studentId, cancellationToken);

        if (purchase is null)
            return ServiceResult<LessonPaymentSessionDto>.NotFound("عملية الشراء غير موجودة.");

        if (purchase.Status == PaymentStatus.Completed)
        {
            return ServiceResult<LessonPaymentSessionDto>.Ok(
                BuildSessionDto(purchase, purchase.Lesson?.Title ?? string.Empty),
                "تم تأكيد عملية الشراء مسبقاً.");
        }

        purchase.Status = PaymentStatus.Completed;
        purchase.PaidAt = DateTime.UtcNow;
        purchase.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceResult<LessonPaymentSessionDto>.Ok(
            BuildSessionDto(purchase, purchase.Lesson?.Title ?? string.Empty),
            "تم إتمام الدفع التجريبي وفتح المحاضرة بنجاح!");
    }

    public async Task<ServiceResult<IReadOnlyList<LessonPaymentSessionDto>>> GetMyPurchasesAsync(
        CancellationToken cancellationToken = default)
    {
        if (!_tenantService.HasTenant || _tenantService.TenantId is null)
            return ServiceResult<IReadOnlyList<LessonPaymentSessionDto>>.NotFound("No tenant was resolved for this request.");

        if (_currentUserService.UserId is not { } studentId ||
            !string.Equals(_currentUserService.Role, nameof(UserRole.Student), StringComparison.Ordinal))
        {
            return ServiceResult<IReadOnlyList<LessonPaymentSessionDto>>.Forbidden();
        }

        var list = await _context.LessonPurchases
            .AsNoTracking()
            .Include(lp => lp.Lesson)
            .Where(lp => lp.StudentId == studentId)
            .OrderByDescending(lp => lp.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = list
            .Select(lp => BuildSessionDto(lp, lp.Lesson?.Title ?? string.Empty))
            .ToList();

        return ServiceResult<IReadOnlyList<LessonPaymentSessionDto>>.Ok(result, "Purchases fetched successfully.");
    }

    public async Task<ApiResponse<CheckoutResponseDto>> CheckoutAsync(
        CheckoutRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        return ApiResponse<CheckoutResponseDto>.SuccessResponse(new CheckoutResponseDto
        {
            CheckoutUrl = "https://checkout.stripe.com/pay/cs_test_sample",
            SessionId = "cs_test_sample_session_id",
            EnrollmentId = Guid.NewGuid()
        }, "Checkout session created stub.");
    }

    public async Task<ApiResponse<bool>> HandleWebhookAsync(
        PaymentWebhookDto webhookData,
        CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        return ApiResponse<bool>.SuccessResponse(true, "Webhook processed successfully stub.");
    }

    private static string? NormalizeProvider(string? provider)
    {
        if (string.IsNullOrWhiteSpace(provider)) return null;
        return provider.Trim().ToLowerInvariant() switch
        {
            "fawry" => "Fawry",
            "vodafonecash" => "VodafoneCash",
            "paymobcard" => "PaymobCard",
            _ => null
        };
    }

    private static LessonPaymentSessionDto BuildSessionDto(LessonPurchase purchase, string lessonTitle)
    {
        var instructions = purchase.PaymentProvider switch
        {
            "Fawry" => $"توجّه لأي ماكينة فوري أو تطبيق MyFawry واختر (مدفوعات التعليم / فوري باي) وأدخل الكود المرجعي {purchase.ReferenceCode} لدفع {purchase.Amount} ج.م (محاكاة تجريبية).",
            "VodafoneCash" => $"افتح محفظة فودافون كاش / انستاباي وحوّل مبلغ {purchase.Amount} ج.م ثم أكّد العملية برقم المرجع {purchase.ReferenceCode} (محاكاة تجريبية).",
            _ => $"ادفع {purchase.Amount} ج.م ببطاقتك البنكية (Visa / Mastercard / Meeza) عبر بوابة Paymob التجريبية — المرجع {purchase.ReferenceCode}."
        };

        return new LessonPaymentSessionDto
        {
            PurchaseId = purchase.Id,
            LessonId = purchase.LessonId,
            LessonTitle = lessonTitle,
            Amount = purchase.Amount,
            Provider = purchase.PaymentProvider,
            ReferenceCode = purchase.ReferenceCode,
            Status = purchase.Status,
            ExpiresAt = purchase.Status == PaymentStatus.Pending ? purchase.CreatedAt.AddHours(24) : null,
            Instructions = instructions,
            PaidAt = purchase.PaidAt,
            IsMockMode = true
        };
    }
}
