using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using TeacherAssistant.Application.DTOs.Tenants;

namespace TeacherAssistant.Application.Common;

public static partial class LandingPageRules
{
    public const int MaxJsonSizeBytes = 50 * 1024; // ~50KB
    public const int MaxStringLength = 2500;

    private static readonly Regex HexColorRegex = new(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", RegexOptions.Compiled);
    private static readonly Regex HtmlTagRegex = new(@"<[^>]*>", RegexOptions.Compiled);

    public static readonly HashSet<string> AllowedFonts = new(StringComparer.OrdinalIgnoreCase)
    {
        "Cairo", "Tajawal", "Almarai", "IBM Plex Sans Arabic"
    };

    public static readonly HashSet<string> AllowedBorderRadii = new(StringComparer.OrdinalIgnoreCase)
    {
        "none", "md", "xl", "full"
    };

    public static readonly HashSet<string> AllowedButtonStyles = new(StringComparer.OrdinalIgnoreCase)
    {
        "solid", "outline", "soft"
    };

    public static readonly Dictionary<string, HashSet<string>> AllowedSectionVariants = new(StringComparer.OrdinalIgnoreCase)
    {
        ["hero"] = new(StringComparer.OrdinalIgnoreCase) { "split", "centered", "fullBackground" },
        ["about"] = new(StringComparer.OrdinalIgnoreCase) { "split", "card", "compact" },
        ["stats"] = new(StringComparer.OrdinalIgnoreCase) { "grid", "inline", "cards" },
        ["subjects"] = new(StringComparer.OrdinalIgnoreCase) { "grid", "carousel", "list" },
        ["testimonials"] = new(StringComparer.OrdinalIgnoreCase) { "grid", "carousel", "quotes" },
        ["faq"] = new(StringComparer.OrdinalIgnoreCase) { "accordion", "twoColumns", "cards" },
        ["contact"] = new(StringComparer.OrdinalIgnoreCase) { "cards", "split", "compact" },
        ["footer"] = new(StringComparer.OrdinalIgnoreCase) { "simple", "columns", "minimal" }
    };

    public static bool IsValidHexColor(string? color)
    {
        if (string.IsNullOrWhiteSpace(color)) return false;
        return HexColorRegex.IsMatch(color.Trim());
    }

    public static bool IsValidHttpUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true; // optional/empty is handled separately
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri)) return false;
        return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
    }

    public static string SanitizeText(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        // Strip HTML tags and normalize whitespace
        var stripped = HtmlTagRegex.Replace(input, string.Empty);
        return stripped.Trim();
    }

    public static List<string> ValidateAndSanitize(LandingPageDto dto)
    {
        var errors = new List<string>();

        if (dto == null)
        {
            errors.Add("Landing page configuration cannot be null.");
            return errors;
        }

        dto.Version = 1;

        // 1. Validate Theme
        dto.Theme ??= new LandingThemeDto();

        if (!IsValidHexColor(dto.Theme.PrimaryColor))
            errors.Add("PrimaryColor must be a valid hex color code (e.g. #0F766E).");
        else
            dto.Theme.PrimaryColor = dto.Theme.PrimaryColor.Trim();

        if (!IsValidHexColor(dto.Theme.SecondaryColor))
            errors.Add("SecondaryColor must be a valid hex color code (e.g. #0D9488).");
        else
            dto.Theme.SecondaryColor = dto.Theme.SecondaryColor.Trim();

        if (!IsValidHexColor(dto.Theme.BackgroundColor))
            errors.Add("BackgroundColor must be a valid hex color code (e.g. #FFFFFF).");
        else
            dto.Theme.BackgroundColor = dto.Theme.BackgroundColor.Trim();

        if (!IsValidHexColor(dto.Theme.TextColor))
            errors.Add("TextColor must be a valid hex color code (e.g. #0F172A).");
        else
            dto.Theme.TextColor = dto.Theme.TextColor.Trim();

        if (!AllowedFonts.Contains(dto.Theme.FontFamily ?? string.Empty))
            errors.Add($"FontFamily must be one of: {string.Join(", ", AllowedFonts)}.");

        if (!AllowedBorderRadii.Contains(dto.Theme.BorderRadius ?? string.Empty))
            errors.Add($"BorderRadius must be one of: {string.Join(", ", AllowedBorderRadii)}.");

        if (!AllowedButtonStyles.Contains(dto.Theme.ButtonStyle ?? string.Empty))
            errors.Add($"ButtonStyle must be one of: {string.Join(", ", AllowedButtonStyles)}.");

        if (!string.IsNullOrWhiteSpace(dto.Theme.HeroImageUrl))
        {
            if (!IsValidHttpUrl(dto.Theme.HeroImageUrl))
                errors.Add("HeroImageUrl must be a valid HTTP/HTTPS URL.");
            else
                dto.Theme.HeroImageUrl = dto.Theme.HeroImageUrl.Trim();
        }

        // 2. Validate Sections
        if (dto.Sections == null || dto.Sections.Count == 0)
        {
            errors.Add("At least one section is required.");
            return errors;
        }

        for (int i = 0; i < dto.Sections.Count; i++)
        {
            var section = dto.Sections[i];
            if (section == null)
            {
                errors.Add($"Section at index {i} cannot be null.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(section.Id))
                section.Id = Guid.NewGuid().ToString("N");
            else
                section.Id = SanitizeText(section.Id);

            if (string.IsNullOrWhiteSpace(section.Type) || !AllowedSectionVariants.TryGetValue(section.Type.Trim(), out var allowedVariants))
            {
                errors.Add($"Section at index {i} has invalid type '{section.Type}'. Allowed types: {string.Join(", ", AllowedSectionVariants.Keys)}.");
                continue;
            }

            section.Type = section.Type.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(section.Variant) || !allowedVariants.Contains(section.Variant.Trim()))
            {
                errors.Add($"Section '{section.Type}' has invalid variant '{section.Variant}'. Allowed variants for {section.Type}: {string.Join(", ", allowedVariants)}.");
            }
            else
            {
                section.Variant = section.Variant.Trim();
            }

            // Sanitize content
            if (section.Content != null)
            {
                SanitizeJsonNode(section.Content, errors);
            }
        }

        // 3. Check serialized payload size
        var json = JsonSerializer.Serialize(dto);
        if (System.Text.Encoding.UTF8.GetByteCount(json) > MaxJsonSizeBytes)
        {
            errors.Add($"Landing page configuration exceeds maximum allowed size of {MaxJsonSizeBytes / 1024} KB.");
        }

        return errors;
    }

    private static void SanitizeJsonNode(JsonNode node, List<string> errors)
    {
        if (node is JsonObject obj)
        {
            var keys = obj.Select(kvp => kvp.Key).ToList();
            foreach (var key in keys)
            {
                var child = obj[key];
                if (child is JsonValue val && val.TryGetValue<string>(out var strVal))
                {
                    if (strVal.Length > MaxStringLength)
                    {
                        errors.Add($"Text field '{key}' exceeds maximum length of {MaxStringLength} characters.");
                        strVal = strVal[..MaxStringLength];
                    }

                    // If it's a URL field, validate URL format if not empty
                    if (key.EndsWith("url", StringComparison.OrdinalIgnoreCase) ||
                        key.EndsWith("link", StringComparison.OrdinalIgnoreCase))
                    {
                        var trimmed = strVal.Trim();
                        // internal links starting with / are allowed, or http/https
                        if (!string.IsNullOrEmpty(trimmed) && !trimmed.StartsWith('/') && !IsValidHttpUrl(trimmed))
                        {
                            errors.Add($"Field '{key}' must be a valid HTTP/HTTPS URL or relative path starting with '/'.");
                        }
                    }

                    obj[key] = JsonValue.Create(SanitizeText(strVal));
                }
                else if (child != null)
                {
                    SanitizeJsonNode(child, errors);
                }
            }
        }
        else if (node is JsonArray arr)
        {
            for (int i = 0; i < arr.Count; i++)
            {
                var item = arr[i];
                if (item is JsonValue val && val.TryGetValue<string>(out var strVal))
                {
                    if (strVal.Length > MaxStringLength)
                    {
                        strVal = strVal[..MaxStringLength];
                    }
                    arr[i] = JsonValue.Create(SanitizeText(strVal));
                }
                else if (item != null)
                {
                    SanitizeJsonNode(item, errors);
                }
            }
        }
    }

    public static LandingPageDto CreateDefault(string teacherName, string? bio, string? primaryColor, string? logoUrl)
    {
        var primary = IsValidHexColor(primaryColor) ? primaryColor!.Trim() : "#0F766E";
        var safeTeacherName = string.IsNullOrWhiteSpace(teacherName) ? "المعلم" : teacherName.Trim();
        var safeBio = string.IsNullOrWhiteSpace(bio)
            ? "منصة تعليمية متكاملة لتقديم أفضل تجربة دراسية ومتابعة مستمرة لطلابنا نحو التفوق والتميز."
            : bio.Trim();

        return new LandingPageDto
        {
            Version = 1,
            Theme = new LandingThemeDto
            {
                PrimaryColor = primary,
                SecondaryColor = "#0D9488",
                BackgroundColor = "#FFFFFF",
                TextColor = "#0F172A",
                FontFamily = "Cairo",
                BorderRadius = "xl",
                ButtonStyle = "solid",
                HeroImageUrl = !string.IsNullOrWhiteSpace(logoUrl) ? logoUrl : "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
            },
            Sections = new List<LandingSectionDto>
            {
                new()
                {
                    Id = "hero",
                    Type = "hero",
                    Enabled = true,
                    Variant = "split",
                    Content = new JsonObject
                    {
                        ["title"] = $"مرحباً بكم في منصة {safeTeacherName}",
                        ["subtitle"] = safeBio,
                        ["primaryButtonText"] = "ابدأ التعلم الآن",
                        ["primaryButtonLink"] = "/register",
                        ["secondaryButtonText"] = "استكشف المواد",
                        ["secondaryButtonLink"] = "/subjects",
                        ["imageUrl"] = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                    }
                },
                new()
                {
                    Id = "about",
                    Type = "about",
                    Enabled = true,
                    Variant = "split",
                    Content = new JsonObject
                    {
                        ["title"] = $"عن {safeTeacherName}",
                        ["bio"] = safeBio,
                        ["features"] = new JsonArray
                        {
                            "شرح مبسط وشامل لجميع أجزاء المنهج",
                            "متابعة دورية وتقييم مستمر لمستوى الطالب",
                            "اختبارات إلكترونية وبنوك أسئلة تدريبية",
                            "دعم فني وتواصل مستمر للإجابة عن الأسئلة"
                        },
                        ["imageUrl"] = "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80"
                    }
                },
                new()
                {
                    Id = "stats",
                    Type = "stats",
                    Enabled = true,
                    Variant = "grid",
                    Content = new JsonObject
                    {
                        ["title"] = "إنجازات وإحصائيات نفخر بها",
                        ["items"] = new JsonArray
                        {
                            new JsonObject { ["label"] = "طالب وطالبة", ["value"] = "+1,500", ["icon"] = "users" },
                            new JsonObject { ["label"] = "سنوات خبرة", ["value"] = "+12", ["icon"] = "award" },
                            new JsonObject { ["label"] = "نسبة التفوق والنجاح", ["value"] = "98%", ["icon"] = "trending-up" },
                            new JsonObject { ["label"] = "ساعة تدريسية مسجلة", ["value"] = "+250", ["icon"] = "clock" }
                        }
                    }
                },
                new()
                {
                    Id = "subjects",
                    Type = "subjects",
                    Enabled = true,
                    Variant = "grid",
                    Content = new JsonObject
                    {
                        ["title"] = "المواد الدراسية والمناهج المتاحة",
                        ["subtitle"] = "اختر مادتك وابدأ بمشاهدة الدروس التفاعلية والمجموعات المفتوحة.",
                        ["showCount"] = 6
                    }
                },
                new()
                {
                    Id = "testimonials",
                    Type = "testimonials",
                    Enabled = true,
                    Variant = "grid",
                    Content = new JsonObject
                    {
                        ["title"] = "آراء وتجارب طلابنا",
                        ["subtitle"] = "قصص نجاح وتفوق نفتخر بأننا كنا جزءاً منها.",
                        ["items"] = new JsonArray
                        {
                            new JsonObject
                            {
                                ["id"] = "1",
                                ["name"] = "أحمد محمود",
                                ["role"] = "طالب ثانوية عامة",
                                ["text"] = "الشرح مبسط جداً وطريقة حل الأسئلة ساعدتني أفرق بين الأفكار المتشابهة في الامتحان وأضمن الدرجة النهائية.",
                                ["avatarUrl"] = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                                ["rating"] = 5
                            },
                            new JsonObject
                            {
                                ["id"] = "2",
                                ["name"] = "مريم خالد",
                                ["role"] = "طالبة متفوقة",
                                ["text"] = "المتابعة الأسبوعية والاختبارات الدورية خلتني واثقة من نفسي وجاهزة لأي امتحان، شكراً جزيلاً!",
                                ["avatarUrl"] = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
                                ["rating"] = 5
                            },
                            new JsonObject
                            {
                                ["id"] = "3",
                                ["name"] = "عمر فاروق",
                                ["role"] = "طالب متميز",
                                ["text"] = "أفضل منصة تعليمية تعاملت معها! بنك الأسئلة والتدريبات المكثفة صنعت فرقاً حقيقياً في مستواي.",
                                ["avatarUrl"] = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
                                ["rating"] = 5
                            }
                        }
                    }
                },
                new()
                {
                    Id = "faq",
                    Type = "faq",
                    Enabled = true,
                    Variant = "accordion",
                    Content = new JsonObject
                    {
                        ["title"] = "الأسئلة الأكثر شيوعاً",
                        ["subtitle"] = "إجابات واضحة لأهم التساؤلات التي يطرحها الطلاب وأولياء الأمور.",
                        ["items"] = new JsonArray
                        {
                            new JsonObject
                            {
                                ["id"] = "1",
                                ["question"] = "كيف يمكنني التسجيل والانضمام لمجموعة دراسية؟",
                                ["answer"] = "يمكنك إنشاء حساب جديد باستخدام كود الجروب المخصص لك من المعلم، أو تسجيل الدخول ثم إدخال الكود للانضمام إلى المجموعة."
                            },
                            new JsonObject
                            {
                                ["id"] = "2",
                                ["question"] = "هل يمكنني مشاهدة الدروس والمحاضرات في أي وقت؟",
                                ["answer"] = "نعم، كافة الدروس والملفات والواجبات تظل متاحة على حسابك طوال فترة اشتراكك في المجموعة لمراجعتها في أي وقت."
                            },
                            new JsonObject
                            {
                                ["id"] = "3",
                                ["question"] = "كيف يتم تقييم مستوى الطالب ومتابعة أدائه؟",
                                ["answer"] = "توفر المنصة تقارير تفصيلية عن إكمال الدروس ودرجات الاختبارات الدورية مع إمكانية متابعة ولي الأمر لدرجات الطالب."
                            },
                            new JsonObject
                            {
                                ["id"] = "4",
                                ["question"] = "ماذا أفعل إذا واجهت مشكلة تقنية في تشغيل الفيديوهات؟",
                                ["answer"] = "فريق الدعم الفني متواجد لمساعدتك عبر الواتساب والمحادثة المباشرة لضمان تجربة تعليمية سلسة دون أي انقطاع."
                            }
                        }
                    }
                },
                new()
                {
                    Id = "contact",
                    Type = "contact",
                    Enabled = true,
                    Variant = "cards",
                    Content = new JsonObject
                    {
                        ["title"] = "تواصل معنا مباشرة",
                        ["subtitle"] = "نحن هنا لمساعدتك والرد على استفساراتك طوال أيام الأسبوع.",
                        ["phone"] = "01000000000",
                        ["whatsapp"] = "01000000000",
                        ["email"] = "support@example.com",
                        ["address"] = "جمهورية مصر العربية"
                    }
                },
                new()
                {
                    Id = "footer",
                    Type = "footer",
                    Enabled = true,
                    Variant = "columns",
                    Content = new JsonObject
                    {
                        ["copyrightText"] = $"جميع الحقوق محفوظة © {DateTime.UtcNow.Year} {safeTeacherName}",
                        ["socialLinks"] = new JsonArray
                        {
                            new JsonObject { ["platform"] = "facebook", ["url"] = "https://facebook.com" },
                            new JsonObject { ["platform"] = "youtube", ["url"] = "https://youtube.com" },
                            new JsonObject { ["platform"] = "telegram", ["url"] = "https://telegram.org" }
                        },
                        ["links"] = new JsonArray
                        {
                            new JsonObject { ["label"] = "المواد الدراسية", ["url"] = "/subjects" },
                            new JsonObject { ["label"] = "تسجيل الدخول", ["url"] = "/login" },
                            new JsonObject { ["label"] = "إنشاء حساب طالب", ["url"] = "/register" }
                        }
                    }
                }
            }
        };
    }
}
