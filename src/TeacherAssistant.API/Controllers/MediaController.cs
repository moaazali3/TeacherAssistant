using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeacherAssistant.API.Authorization;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Application.Common.Models;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.API.Controllers;

public class UploadedImageDto
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
}

public class MediaController : BaseApiController
{
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif"
    };

    private static readonly Regex SafeSegmentRegex = new("[^a-z0-9_-]", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly IWebHostEnvironment _environment;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;

    public MediaController(
        IWebHostEnvironment environment,
        ITenantService tenantService,
        ICurrentUserService currentUserService)
    {
        _environment = environment;
        _tenantService = tenantService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Uploads an image into the local backend `storage` folder and returns its public `/storage/...` URL.
    /// Videos remain external links and are not accepted by this endpoint.
    /// </summary>
    [HttpPost("upload-image")]
    [Authorize(Policy = AuthorizationPolicies.InstructorOrAssistant)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<UploadedImageDto>>> UploadImage(
        IFormFile file,
        [FromForm] string? folder = null,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUserService.HasPermission(AssistantPermissions.ManageContent))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<UploadedImageDto>.FailureResponse("ليس لديك صلاحية رفع الصور."));
        }

        if (!_tenantService.HasTenant || string.IsNullOrWhiteSpace(_tenantService.Subdomain))
        {
            return BadRequest(ApiResponse<UploadedImageDto>.FailureResponse(
                "يجب تحديد المنصة لرفع الصورة."));
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<UploadedImageDto>.FailureResponse("يرجى اختيار صورة صالحة."));
        }

        if (file.Length > MaxImageBytes)
        {
            return BadRequest(ApiResponse<UploadedImageDto>.FailureResponse(
                "حجم الصورة يجب ألا يتجاوز 5 ميجابايت."));
        }

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
        if (!AllowedExtensions.Contains(ext) || !AllowedContentTypes.Contains(file.ContentType ?? string.Empty))
        {
            return BadRequest(ApiResponse<UploadedImageDto>.FailureResponse(
                "نوع الملف غير مدعوم. الصيغ المسموحة للصور هي: JPG, PNG, WebP, GIF."));
        }

        var safeTenant = SanitizeSegment(_tenantService.Subdomain, "shared");
        var safeFolder = SanitizeSegment(folder, "images");
        var storedFileName = $"{Guid.NewGuid():N}{ext}";

        var targetDir = Path.Combine(_environment.ContentRootPath, "storage", safeTenant, safeFolder);
        Directory.CreateDirectory(targetDir);

        var fullPath = Path.Combine(targetDir, storedFileName);
        await using (var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var publicUrl = $"/storage/{safeTenant}/{safeFolder}/{storedFileName}";

        return Ok(ApiResponse<UploadedImageDto>.SuccessResponse(new UploadedImageDto
        {
            Url = publicUrl,
            FileName = storedFileName,
            SizeBytes = file.Length,
            ContentType = file.ContentType ?? "application/octet-stream"
        }, "تم رفع الصورة بنجاح."));
    }

    private static string SanitizeSegment(string? raw, string fallback)
    {
        if (string.IsNullOrWhiteSpace(raw)) return fallback;
        var cleaned = SafeSegmentRegex.Replace(raw.Trim().ToLowerInvariant(), string.Empty);
        return string.IsNullOrWhiteSpace(cleaned) ? fallback : cleaned;
    }
}
