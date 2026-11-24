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
            var trimmedHero = dto.Theme.HeroImageUrl.Trim();
            if (!trimmedHero.StartsWith('/') && !IsValidHttpUrl(trimmedHero))
                errors.Add("HeroImageUrl must be a valid HTTP/HTTPS URL or relative path starting with '/'.");
            else
                dto.Theme.HeroImageUrl = trimmedHero;
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
        var primary = IsValidHexColor(primaryColor) ? primaryColor!.Trim() : "#3730A3";
        var safeTeacherName = string.IsNullOrWhiteSpace(teacherName) || teacherName.Equals("Demo Academy", StringComparison.OrdinalIgnoreCase)
            ? "منصة أ. طارق المنشاوي للكيمياء"
            : teacherName.Trim();
        var safeBio = string.IsNullOrWhiteSpace(bio) || bio.Contains("demo teacher", StringComparison.OrdinalIgnoreCase) || bio.Contains("Teaching chemistry", StringComparison.OrdinalIgnoreCase)
            ? "أقوى منصة لشرح ومراجعة منهج الثانوية العامة والأزهرية — شرح تفصيلي على السبورة الذكية، ملازم PDF، بنوك أسئلة الكتب الخارجية، ومتابعة أسبوعية مع ولي الأمر."
            : bio.Trim();
        var portraitUrl = !string.IsNullOrWhiteSpace(logoUrl)
            ? logoUrl
            : "/images/teachers/teacher-chem.jpg";

        return new LandingPageDto
        {
            Version = 1,
            Theme = new LandingThemeDto
            {
                PrimaryColor = primary,
                SecondaryColor = "#D97706",
                BackgroundColor = "#FAF7F2",
                TextColor = "#1C1917",
                FontFamily = "Cairo",
                BorderRadius = "xl",
                ButtonStyle = "solid",
                HeroImageUrl = portraitUrl
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
                        ["title"] = $"{safeTeacherName} — طريقك للدرجة النهائية في الثانوية العامة",
                        ["subtitle"] = safeBio,
                        ["primaryButtonText"] = "انضم للمنصة الآن",
                        ["primaryButtonLink"] = "/register",
                        ["secondaryButtonText"] = "تصفح محاضرات المنهج",
                        ["secondaryButtonLink"] = "/subjects",
                        ["imageUrl"] = portraitUrl
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
                        ["title"] = $"نظام الشرح والمتابعة في {safeTeacherName}",
                        ["bio"] = safeBio,
                        ["features"] = new JsonArray
                        {
                            "محاضرة شرح أسبوعية شاملة + حصة حل كتاب الامتحان ومندليف والوسام",
                            "كويز إجباري على كل حصة وامتحان شهري شامل بنظام البابل شيت والـ Open Book",
                            "مذكرات وملازم PDF ملونة ومنظمة لكل باب جاهزة للتحميل والطباعة",
                            "تقرير متابعة أسبوعي لولي الأمر بالحضور ودرجات الكويزات والواجبات"
                        },
                        ["imageUrl"] = portraitUrl
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
                        ["title"] = "أرقام وإنجازات طلابنا في امتحانات الثانوية العامة",
                        ["items"] = new JsonArray
                        {
                            new JsonObject { ["label"] = "طالب وطالبة في السنتر والأونلاين", ["value"] = "+18,500", ["icon"] = "users" },
                            new JsonObject { ["label"] = "طالب قفّل المادة (الدرجة النهائية)", ["value"] = "+940", ["icon"] = "award" },
                            new JsonObject { ["label"] = "سنة خبرة في تدريس الثانوية العامة", ["value"] = "+16", ["icon"] = "trending-up" },
                            new JsonObject { ["label"] = "محاضرة وحصة حل كتاب خارجي", ["value"] = "+320", ["icon"] = "clock" }
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
                        ["title"] = "الأبواب والكورسات المتاحة لطلاب الثانوية العامة",
                        ["subtitle"] = "اختر الباب أو معسكر المراجعة النهائية، وادخل بكود مجموعة السنتر أو الأونلاين لفتح المحاضرات والملازم.",
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
                        ["title"] = "لوحة شرف أوائل الجمهورية والمتفوقين",
                        ["subtitle"] = "نماذج من طلابنا أوائل الثانوية العامة الذين حققوا الدرجة النهائية والتحقوا بكليات القمة.",
                        ["items"] = new JsonArray
                        {
                            new JsonObject
                            {
                                ["id"] = "1",
                                ["name"] = "د. عبدالرحمن طارق",
                                ["role"] = "60 / 60 — كلية الطب البشري جامعة القاهرة (دفعة 2025)",
                                ["text"] = "والله بفضل الله ثم شرح المستر وحل أفكار المستويات العليا في المراجعات النهائية دخلت الامتحان مفيش فكرة أول مرة أشوفها وقفلت المادة.",
                                ["avatarUrl"] = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                                ["rating"] = 5
                            },
                            new JsonObject
                            {
                                ["id"] = "2",
                                ["name"] = "م. مريم خالد المنشاوي",
                                ["role"] = "59.5 / 60 — كلية الهندسة جامعة عين شمس (دفعة 2025)",
                                ["text"] = "نظام الكويزات الأسبوعية قبل فتح الحصة الجديدة كان بيجبرني أذاكر أول بأول ومراكمش أي باب عليا لحد ليلة الامتحان.",
                                ["avatarUrl"] = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
                                ["rating"] = 5
                            },
                            new JsonObject
                            {
                                ["id"] = "3",
                                ["name"] = "د. عمر فاروق الشافعي",
                                ["role"] = "60 / 60 — كلية الصيدلة جامعة الإسكندرية (دفعة 2025)",
                                ["text"] = "ملازم المراجعة النهائية وتجميعات القوانين والملاحظات وفرت عليا وقت رهيب، وحصص حل الكتب الخارجية خلتني أحل أي سؤال في دقيقتين.",
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
                        ["title"] = "أسئلة تهم كل طالب وولي أمر في الثانوية العامة",
                        ["subtitle"] = "كل ما تريد معرفته عن نظام الحصص، أكواد السنتر والأونلاين، استلام الملازم، ومتابعة درجات الطالب.",
                        ["items"] = new JsonArray
                        {
                            new JsonObject
                            {
                                ["id"] = "1",
                                ["question"] = "معايا كود الجروب من السنتر أو حجز الأونلاين، إزاي أفعّل الحصص؟",
                                ["answer"] = "اضغط على زر (سجّل بكود الجروب) أو اكتب الكود مباشرة في خانة الانضمام السريع أعلى الصفحة، وهيتم إضافتك لمجموعتك وفتح كل محاضرات وملازم الباب فوراً."
                            },
                            new JsonObject
                            {
                                ["id"] = "2",
                                ["question"] = "هل المحاضرات بتنزل بمواعيد ثابتة؟ وينفع أعيد سماع الحصة أكتر من مرة؟",
                                ["answer"] = "نعم، المحاضرات بتنزل بجدول أسبوعي ثابت (محاضرة الشرح + محاضرة حل الواجب والكتب الخارجية)، وتقدر تعيد مشاهدة الشرح في أي وقت لمراجعة الأفكار الصعبة."
                            },
                            new JsonObject
                            {
                                ["id"] = "3",
                                ["question"] = "إزاي بستلم ملازم الشرح والواجب؟",
                                ["answer"] = "الملازم متوفرة بصيغة PDF عالية الجودة داخل كل درس لتحميلها فوراً، وكمان تقدر تستلم النسخة المطبوعة من السنتر أو طلب شحنها لباب البيت."
                            },
                            new JsonObject
                            {
                                ["id"] = "4",
                                ["question"] = "إزاي ولي الأمر يقدر يتابع مستوى الطالب ودرجات الامتحانات؟",
                                ["answer"] = "المنصة بتسجل حضور الطالب ودرجات كويز كل حصة والامتحان الشهري الشامل، وبيتم إرسال تقرير متابعة دوري لولي الأمر على الواتساب."
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
                        ["title"] = "تواصل مع فريق الدعم والسكرتارية",
                        ["subtitle"] = "متواجدون يومياً لمساعدتك في تفعيل الأكواد، مواعيد مجموعات السنتر، وحجز الملازم.",
                        ["phone"] = "01012345678",
                        ["whatsapp"] = "201012345678",
                        ["email"] = "support@thanawya-academy.eg",
                        ["address"] = "القاهرة الكبرى والمحافظات — متاح أونلاين بجميع أنحاء الجمهورية"
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
                            new JsonObject { ["platform"] = "youtube", ["url"] = "https://youtube.com" },
                            new JsonObject { ["platform"] = "facebook", ["url"] = "https://facebook.com" },
                            new JsonObject { ["platform"] = "telegram", ["url"] = "https://telegram.org" }
                        },
                        ["links"] = new JsonArray
                        {
                            new JsonObject { ["label"] = "محاضرات المنهج", ["url"] = "/subjects" },
                            new JsonObject { ["label"] = "دخول الطلاب", ["url"] = "/login" },
                            new JsonObject { ["label"] = "تفعيل كود الجروب", ["url"] = "/register" }
                        }
                    }
                }
            }
        };
    }
}
