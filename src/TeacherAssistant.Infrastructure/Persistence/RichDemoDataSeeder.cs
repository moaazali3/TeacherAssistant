using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;

namespace TeacherAssistant.Infrastructure.Persistence;

/// <summary>
/// Idempotent rich demo-data seeder: 4 teacher tenants (maths, physics, arabic, bio),
/// 3-4 published subjects each, 2 groups per subject, 10 students per tenant.
/// Triggered by Database:SeedRichData=true — runs regardless of environment.
/// NEVER logs passwords or join codes.
/// </summary>
public class RichDemoDataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<RichDemoDataSeeder> _logger;

    private const string DemoPassword = "Demo@12345";

    public RichDemoDataSeeder(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<RichDemoDataSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────
    //  Public entry point
    // ─────────────────────────────────────────────────────────────
    public async Task SeedAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("RichDemoDataSeeder: starting …");

        foreach (var spec in TenantSpecs)
            await SeedTenantAsync(spec, ct);

        _logger.LogInformation("RichDemoDataSeeder: finished.");
    }

    // ─────────────────────────────────────────────────────────────
    //  Tenant definitions
    // ─────────────────────────────────────────────────────────────
    private static readonly TenantSpec[] TenantSpecs =
    [
        new(
            Subdomain:     "maths",
            Name:          "منصة أ. محمود الشافعي للرياضيات",
            PrimaryColor:  "#1D4ED8",
            Bio:           "منصة أ. محمود الشافعي لشرح الرياضيات البحتة والتطبيقية (التفاضل والتكامل، الجبر والهندسة الفراغية، الإحصاء) لطلاب علمي رياضة بالثانوية العامة مع حل كتاب المعاصر كامل.",
            TeacherEmail:  "teacher@maths.local",
            TeacherName:   "أ. محمود الشافعي",
            LogoUrl:       "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
            Subjects: [
                new("رياضيات - تالتة ثانوي",
                    "مراجعة شاملة لمنهج الرياضيات للصف الثالث الثانوي.",
                    "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SUN8MATH", "جروب الأحد 8 ص", "السبت 8 صباحاً - رياضيات ثالثة"),
                        new("TUE6MATH", "جروب الثلاثاء 6 م", "الثلاثاء 6 مساءً - رياضيات ثالثة"),
                    ],
                    MathLessons()),
                new("جبر وهندسة فراغية",
                    "دروس في الجبر والهندسة الفراغية للصف الثالث الثانوي.",
                    "https://images.unsplash.com/photo-1635372722656-389f87a941b7?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SAT7ALG", "جروب السبت 7 ص", "السبت 7 صباحاً - جبر"),
                        new("WED5ALG", "جروب الأربعاء 5 م", "الأربعاء 5 مساءً - جبر"),
                    ],
                    AlgebraLessons()),
                new("إحصاء واحتمالات",
                    "أساسيات الإحصاء والاحتمالات للمرحلة الثانوية.",
                    "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("MON9STAT", "جروب الاثنين 9 ص", "الاثنين 9 صباحاً - إحصاء"),
                        new("THU4STAT", "جروب الخميس 4 م", "الخميس 4 مساءً - إحصاء"),
                    ],
                    StatLessons()),
                new("تفاضل وتكامل - مراجعة نهائية",
                    "مراجعة نهائية في التفاضل والتكامل (مسودة).",
                    "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80",
                    false,
                    [],
                    []),
            ],
            StudentEmails: GenerateStudents("maths", 10)
        ),

        new(
            Subdomain:     "physics",
            Name:          "منصة أ. حسام الدين رأفت للفيزياء",
            PrimaryColor:  "#7C3AED",
            Bio:           "منصة أ. حسام الدين رأفت لتبسيط الفيزياء الكهربية والحديثة للثانوية العامة — تجارب عملية، تأسيس قوانين كيرشوف وأوم، وحل أفكار المستويات العليا من كتاب الامتحان ونيوتن.",
            TeacherEmail:  "teacher@physics.local",
            TeacherName:   "أ. حسام الدين رأفت",
            LogoUrl:       "/images/teachers/teacher-physics.jpg",
            Subjects: [
                new("فيزياء - تالتة ثانوي",
                    "منهج الفيزياء كامل للصف الثالث الثانوي - الجزء الأول.",
                    "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("FRI10PHY", "جروب الجمعة 10 ص", "الجمعة 10 صباحاً - فيزياء"),
                        new("SAT3PHY",  "جروب السبت 3 م",   "السبت 3 مساءً - فيزياء"),
                    ],
                    PhysicsLessons()),
                new("الكهرومغناطيسية",
                    "شرح تفصيلي لوحدة الكهرومغناطيسية.",
                    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SUN2EM", "جروب الأحد 2 م", "الأحد 2 مساءً - كهرومغناطيس"),
                        new("MON7EM", "جروب الاثنين 7 م", "الاثنين 7 مساءً - كهرومغناطيس"),
                    ],
                    ElectroLessons()),
                new("الميكانيكا والديناميكا",
                    "وحدة الميكانيكا الكلاسيكية وقوانين نيوتن.",
                    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("TUE8MEC", "جروب الثلاثاء 8 ص", "الثلاثاء 8 صباحاً - ميكانيكا"),
                        new("WED6MEC", "جروب الأربعاء 6 م", "الأربعاء 6 مساءً - ميكانيكا"),
                    ],
                    MechanicsLessons()),
                new("الفيزياء الحديثة - مسودة",
                    "النسبية وفيزياء الكم (قيد الإعداد).",
                    "https://images.unsplash.com/photo-1446776899648-aa78eefe8ed0?auto=format&fit=crop&w=800&q=80",
                    false,
                    [],
                    []),
            ],
            StudentEmails: GenerateStudents("physics", 12)
        ),

        new(
            Subdomain:     "arabic",
            Name:          "منصة أ. عبدالرحمن السوهاجي للغة العربية",
            PrimaryColor:  "#059669",
            Bio:           "منصة العميد أ. عبدالرحمن السوهاجي للدرجة النهائية (80 من 80) في اللغة العربية للثانوية العامة — تأسيس شامل في النحو والبلاغة والأدب والنصوص المتحررة والقراءة والتعبير.",
            TeacherEmail:  "teacher@arabic.local",
            TeacherName:   "أ. عبدالرحمن السوهاجي",
            LogoUrl:       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&q=85",
            Subjects: [
                new("لغة عربية - تالتة ثانوي",
                    "منهج اللغة العربية للصف الثالث الثانوي - نصوص وقواعد.",
                    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("MON5ARB", "جروب الاثنين 5 م", "الاثنين 5 مساءً - لغة عربية"),
                        new("WED8ARB", "جروب الأربعاء 8 ص", "الأربعاء 8 صباحاً - لغة عربية"),
                    ],
                    ArabicLessons()),
                new("النحو والصرف",
                    "قواعد النحو والصرف للمرحلة الثانوية.",
                    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SAT9NAH", "جروب السبت 9 ص", "السبت 9 صباحاً - نحو"),
                        new("TUE4NAH", "جروب الثلاثاء 4 م", "الثلاثاء 4 مساءً - نحو"),
                    ],
                    NahwLessons()),
                new("الأدب والبلاغة",
                    "دراسة النصوص الأدبية وأساليب البلاغة.",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SUN6ADL", "جروب الأحد 6 م", "الأحد 6 مساءً - أدب"),
                        new("FRI7ADL", "جروب الجمعة 7 ص", "الجمعة 7 صباحاً - أدب"),
                    ],
                    AdabLessons()),
                new("التعبير والكتابة - مسودة",
                    "مهارات التعبير الكتابي والإنشاء (قيد الإعداد).",
                    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
                    false,
                    [],
                    []),
            ],
            StudentEmails: GenerateStudents("arabic", 10)
        ),

        new(
            Subdomain:     "bio",
            Name:          "منصة أ. سلمى عبدالحميد للأحياء",
            PrimaryColor:  "#16A34A",
            Bio:           "منصة الأستاذة سلمى عبدالحميد لشرح الأحياء والجيولوجيا لطلاب علمي علوم بالثانوية العامة — شرح الدعامة والحركة والهرمونات والمناعة وDNA بالأنيميشن الطبي والرسوم التوضيحية.",
            TeacherEmail:  "teacher@bio.local",
            TeacherName:   "أ. سلمى عبدالحميد",
            LogoUrl:       "/images/teachers/teacher-bio.jpg",
            Subjects: [
                new("أحياء - تالتة ثانوي",
                    "منهج الأحياء للصف الثالث الثانوي - الجزء الأول والثاني.",
                    "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("MON8BIO", "جروب الاثنين 8 ص", "الاثنين 8 صباحاً - أحياء"),
                        new("WED5BIO", "جروب الأربعاء 5 م", "الأربعاء 5 مساءً - أحياء"),
                    ],
                    BioLessons()),
                new("وراثة وتطور",
                    "وحدة الوراثة والتطور والهندسة الوراثية.",
                    "https://images.unsplash.com/photo-1628595351029-c2bf17511435?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SAT6GEN", "جروب السبت 6 م", "السبت 6 مساءً - وراثة"),
                        new("TUE9GEN", "جروب الثلاثاء 9 ص", "الثلاثاء 9 صباحاً - وراثة"),
                    ],
                    GeneticsLessons()),
                new("فسيولوجيا الإنسان",
                    "وظائف أعضاء جسم الإنسان - تفصيل وشرح.",
                    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80",
                    true,
                    [
                        new("SUN3PHY", "جروب الأحد 3 م", "الأحد 3 مساءً - فسيولوجيا"),
                        new("FRI8PHY", "جروب الجمعة 8 ص", "الجمعة 8 صباحاً - فسيولوجيا"),
                    ],
                    PhysioLessons()),
                new("بيئة وتلوث - مسودة",
                    "البيئة والتلوث ومشاكل السكان (قيد الإعداد).",
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
                    false,
                    [],
                    []),
            ],
            StudentEmails: GenerateStudents("bio", 11)
        ),
    ];

    // ─────────────────────────────────────────────────────────────
    //  Core seeding logic
    // ─────────────────────────────────────────────────────────────
    private async Task SeedTenantAsync(TenantSpec spec, CancellationToken ct)
    {
        // 1. Tenant
        var subdomain = SubdomainRules.Normalize(spec.Subdomain);
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Subdomain == subdomain, ct);
        if (tenant is null)
        {
            tenant = new Tenant
            {
                Name         = spec.Name,
                Subdomain    = subdomain,
                PrimaryColor = spec.PrimaryColor,
                Bio          = spec.Bio,
                LogoUrl      = spec.LogoUrl,
                IsActive     = true,
            };
            var landingDto = LandingPageRules.CreateDefault(
                tenant.Name,
                tenant.Bio,
                tenant.PrimaryColor,
                tenant.LogoUrl);
            tenant.LandingPageJson = System.Text.Json.JsonSerializer.Serialize(
                landingDto,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                });
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync(ct);
            _logger.LogInformation("RichDemoDataSeeder: Created tenant '{Subdomain}'.", subdomain);
        }
        else
        {
            tenant.Name = spec.Name;
            tenant.Bio = spec.Bio;
            tenant.PrimaryColor = spec.PrimaryColor;
            tenant.LogoUrl = spec.LogoUrl;
            var landingDto = LandingPageRules.CreateDefault(
                tenant.Name,
                tenant.Bio,
                tenant.PrimaryColor,
                tenant.LogoUrl);
            tenant.LandingPageJson = System.Text.Json.JsonSerializer.Serialize(
                landingDto,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                });
            await _context.SaveChangesAsync(ct);
        }

        // 2. Teacher
        var teacherEmail = spec.TeacherEmail.ToLowerInvariant().Trim();
        var teacher = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.TenantId == tenant.Id && u.Email == teacherEmail, ct);

        if (teacher is null)
        {
            teacher = new User
            {
                Name     = spec.TeacherName,
                Email    = teacherEmail,
                Role     = UserRole.Instructor,
                TenantId = tenant.Id,
            };
            teacher.PasswordHash = _passwordHasher.HashPassword(teacher, DemoPassword);
            _context.Users.Add(teacher);
            await _context.SaveChangesAsync(ct);
        }
        else if (teacher.Name != spec.TeacherName)
        {
            teacher.Name = spec.TeacherName;
            await _context.SaveChangesAsync(ct);
        }

        // 3. Subjects, groups, lessons
        foreach (var subjectSpec in spec.Subjects)
            await SeedSubjectAsync(tenant, teacher, subjectSpec, ct);

        // 4. Students
        await SeedStudentsAsync(tenant, spec.StudentEmails, ct);
    }

    private async Task SeedSubjectAsync(
        Tenant tenant, User teacher, SubjectSpec spec, CancellationToken ct)
    {
        var subject = await _context.Subjects
            .Include(s => s.Groups)
            .Include(s => s.Lessons)
            .FirstOrDefaultAsync(s => s.TenantId == tenant.Id && s.Title == spec.Title, ct);

        if (subject is null)
        {
            subject = new Subject
            {
                Title        = spec.Title,
                Description  = spec.Description,
                GradeLevel   = "الصف الثالث الثانوي",
                ThumbnailUrl = spec.ThumbnailUrl,
                IsPublished  = spec.IsPublished,
                TenantId     = tenant.Id,
                InstructorId = teacher.Id,
            };
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync(ct);
        }
        else if (string.IsNullOrWhiteSpace(subject.GradeLevel))
        {
            subject.GradeLevel = "الصف الثالث الثانوي";
            await _context.SaveChangesAsync(ct);
        }

        // Groups
        foreach (var gs in spec.Groups)
        {
            var code = JoinCodeRules.Normalize(gs.Code);
            var existingGroup = await _context.Groups
                .FirstOrDefaultAsync(g => g.TenantId == tenant.Id && g.JoinCode == code, ct);

            if (existingGroup is null)
            {
                _context.Groups.Add(new Group
                {
                    Name         = gs.Name,
                    ScheduleText = gs.Schedule,
                    JoinCode     = code,
                    IsCodeActive = true,
                    IsOpen       = true,
                    TenantId     = tenant.Id,
                    SubjectId    = subject.Id,
                });
            }
        }
        await _context.SaveChangesAsync(ct);

        // Lessons
        const string samplePdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        int sortOrder = 1;
        Lesson? firstLesson = null;
        foreach (var ls in spec.Lessons)
        {
            var moduleTitle = sortOrder <= 2
                ? "الباب الأول: الشرح والتأسيس"
                : "الباب الثاني: التطبيقات وحل المسائل";
            var attachmentUrl = ls.ContentType == ContentType.Video ? samplePdfUrl : null;

            var existingLesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.SubjectId == subject.Id && l.Title == ls.Title, ct);

            if (existingLesson is null)
            {
                existingLesson = new Lesson
                {
                    Title         = ls.Title,
                    Description   = ls.Description,
                    ContentType   = ls.ContentType,
                    ContentUrl    = ls.ContentUrl,
                    SortOrder     = sortOrder,
                    ModuleTitle   = moduleTitle,
                    AttachmentUrl = attachmentUrl,
                    IsPublished   = true,
                    TenantId      = tenant.Id,
                    SubjectId     = subject.Id,
                };
                _context.Lessons.Add(existingLesson);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(existingLesson.ModuleTitle))
                    existingLesson.ModuleTitle = moduleTitle;
                if (string.IsNullOrWhiteSpace(existingLesson.AttachmentUrl) && attachmentUrl is not null)
                    existingLesson.AttachmentUrl = attachmentUrl;
            }

            firstLesson ??= existingLesson;
            sortOrder++;
        }
        await _context.SaveChangesAsync(ct);

        if (spec.IsPublished && firstLesson is not null)
        {
            await SeedSubjectAssessmentsAsync(tenant.Id, subject, firstLesson, ct);
            await _context.SaveChangesAsync(ct);
        }
    }

    private async Task SeedSubjectAssessmentsAsync(
        Guid tenantId,
        Subject subject,
        Lesson firstLesson,
        CancellationToken ct)
    {
        var jsonOptions = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        };

        var hwTitle = $"واجب المحاضرة الأولى — {subject.Title}";
        if (!await _context.Quizzes.AnyAsync(q => q.SubjectId == subject.Id && q.Title == hwTitle, ct))
        {
            var hwQuestions = new[]
            {
                new
                {
                    id = "rich-hw-q1",
                    prompt = $"اختبر فهمك للمفاهيم الأساسية التي تم شرحها في «{firstLesson.Title}»:",
                    options = new[] { "تطبيق القواعد الأساسية بالخطوات المنظمة", "تجاهل المعطيات في المسألة", "حفظ الناتج النهائي بدون فهم", "عدم التحقق من وحدات القياس" },
                    correctOptionIndex = 0,
                    points = 5m
                },
                new
                {
                    id = "rich-hw-q2",
                    prompt = "أفضل طريقة لمذاكرة هذه المحاضرة قبل حل الواجب الكامل هي:",
                    options = new[] { "مشاهدة الشرح مع تدوين الملاحظات ومراجعة الملزمة", "الانتقال للامتحان دون حل تدريبات", "تأجيل الحل لنهاية العام", "الاعتماد على الملخص السطحي فقط" },
                    correctOptionIndex = 0,
                    points = 5m
                }
            };

            _context.Quizzes.Add(new Quiz
            {
                TenantId = tenantId,
                SubjectId = subject.Id,
                LessonId = firstLesson.Id,
                Title = hwTitle,
                Type = AssessmentType.Homework,
                PassingScorePercent = 50,
                IsPublished = true,
                QuestionsData = System.Text.Json.JsonSerializer.Serialize(hwQuestions, jsonOptions),
                TotalScore = 10m
            });
        }

        var examTitle = $"امتحان تقييمي على الباب الأول — {subject.Title}";
        if (!await _context.Quizzes.AnyAsync(q => q.SubjectId == subject.Id && q.Title == examTitle, ct))
        {
            var examQuestions = new[]
            {
                new
                {
                    id = "rich-ex-q1",
                    prompt = $"سؤال تطبيقي (1) في مادة {subject.Title}: ما الخطوة الأولى الصحيحة لحل مسائل المستويات العليا؟",
                    options = new[] { "تحليل المعطيات وتحديد القانون المناسب", "التخمين العشوائي بين الاختيارات", "إهمال شروط المسألة", "تبديل الوحدات بشكل خاطئ" },
                    correctOptionIndex = 0,
                    points = 5m
                },
                new
                {
                    id = "rich-ex-q2",
                    prompt = $"سؤال تطبيقي (2) على درس «{firstLesson.Title}»: التحقق من صحة الناتج يعتمد على:",
                    options = new[] { "مراجعة خطوات الحل والتأكد من منطقية النتيجة", "تغيير المطلوب في السؤال", "حذف خطوة التعويض", "اختيار أطول رقم فقط" },
                    correctOptionIndex = 0,
                    points = 5m
                }
            };

            _context.Quizzes.Add(new Quiz
            {
                TenantId = tenantId,
                SubjectId = subject.Id,
                LessonId = firstLesson.Id,
                Title = examTitle,
                Type = AssessmentType.Exam,
                DurationMinutes = 15,
                PassingScorePercent = 60,
                IsPublished = true,
                QuestionsData = System.Text.Json.JsonSerializer.Serialize(examQuestions, jsonOptions),
                TotalScore = 10m
            });
        }
    }

    private async Task SeedStudentsAsync(
        Tenant tenant, string[] emails, CancellationToken ct)
    {
        // Get all published subjects for this tenant (to distribute students)
        var publishedSubjects = await _context.Subjects
            .Where(s => s.TenantId == tenant.Id && s.IsPublished)
            .ToListAsync(ct);

        if (publishedSubjects.Count == 0) return;

        // Get all groups indexed by subject
        var groups = await _context.Groups
            .Where(g => g.TenantId == tenant.Id)
            .ToListAsync(ct);

        int studentIndex = 0;
        foreach (var email in emails)
        {
            var normalizedEmail = email.ToLowerInvariant().Trim();

            var student = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.TenantId == tenant.Id && u.Email == normalizedEmail, ct);

            if (student is null)
            {
                // Build Arabic name from index
                var name = ArabicStudentName(studentIndex);
                student = new User
                {
                    Name     = name,
                    Email    = normalizedEmail,
                    Role     = UserRole.Student,
                    TenantId = tenant.Id,
                };
                student.PasswordHash = _passwordHasher.HashPassword(student, DemoPassword);
                _context.Users.Add(student);
                await _context.SaveChangesAsync(ct);
            }

            // Enroll in one group per published subject (round-robin across groups)
            foreach (var subject in publishedSubjects)
            {
                var subjectGroups = groups.Where(g => g.SubjectId == subject.Id).ToList();
                if (subjectGroups.Count == 0) continue;

                var group = subjectGroups[studentIndex % subjectGroups.Count];

                var alreadyMember = await _context.GroupMemberships
                    .AnyAsync(m => m.GroupId == group.Id && m.StudentId == student.Id, ct);

                if (!alreadyMember)
                {
                    _context.GroupMemberships.Add(new GroupMembership
                    {
                        GroupId   = group.Id,
                        SubjectId = subject.Id,
                        StudentId = student.Id,
                        TenantId  = tenant.Id,
                        JoinedAt  = DateTime.UtcNow.AddDays(-new Random(studentIndex).Next(1, 60)),
                    });
                }
            }

            await _context.SaveChangesAsync(ct);
            studentIndex++;
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────
    private static string[] GenerateStudents(string domain, int count)
    {
        var arr = new string[count];
        for (int i = 1; i <= count; i++)
            arr[i - 1] = $"student{i}@{domain}.local";
        return arr;
    }

    private static string ArabicStudentName(int index)
    {
        string[] firstNames = ["أحمد", "محمد", "علي", "يوسف", "عمر", "خالد", "كريم", "مصطفى", "إبراهيم", "حسين", "فاطمة", "نور", "سارة", "مريم", "دينا", "ريم", "لين", "هنا", "آية", "شيماء"];
        string[] lastNames  = ["محمد", "أحمد", "حسن", "إبراهيم", "علي", "سيد", "عبدالله", "منصور", "سعيد", "راضي"];
        return $"{firstNames[index % firstNames.Length]} {lastNames[index % lastNames.Length]}";
    }

    // ─────────────────────────────────────────────────────────────
    //  Lesson sets per subject
    // ─────────────────────────────────────────────────────────────
    private static LessonSpec[] MathLessons() =>
    [
        new("مقدمة في التفاضل والتكامل",
            "مفهوم النهايات والاستمرارية - الدرس الأول",
            ContentType.Video,
            "https://www.youtube.com/watch?v=WsQQvHm4lSw"),
        new("قواعد الاشتقاق",
            "الاشتقاق وقواعده الأساسية مع حل أمثلة",
            ContentType.Video,
            "https://www.youtube.com/watch?v=5yfh5cf4-0Y"),
        new("ملزمة الرياضيات - المصدر",
            "ملزمة شاملة بجميع قواعد التفاضل والتكامل",
            ContentType.Pdf,
            "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view"),
        new("مقال: أسرار حل مسائل التكامل",
            "خطوات منهجية لحل مسائل التكامل بسهولة",
            ContentType.Article,
            "https://ar.khanacademy.org/math/ap-calculus-ab"),
    ];

    private static LessonSpec[] AlgebraLessons() =>
    [
        new("الجبر الخطي - المصفوفات",
            "مقدمة في المصفوفات وعمليات الجمع والضرب",
            ContentType.Video,
            "https://www.youtube.com/watch?v=ZK3O402wf1c"),
        new("المحددات وقاعدة كرامر",
            "شرح المحددات وتطبيقاتها في حل المعادلات",
            ContentType.Video,
            "https://www.youtube.com/watch?v=aKX5_DucNq8"),
        new("ملزمة الجبر الخطي",
            "ملزمة شاملة بأسئلة وحلول نموذجية",
            ContentType.Pdf,
            "https://drive.google.com/file/d/algebra-linear-notes/view"),
        new("تمارين تفاعلية على الجبر",
            "مجموعة تمارين متدرجة الصعوبة مع الحلول",
            ContentType.Link,
            "https://www.geogebra.org/m/algebra"),
    ];

    private static LessonSpec[] StatLessons() =>
    [
        new("مقدمة في الإحصاء الوصفي",
            "المتوسط والوسيط والمنوال - تعريفات وأمثلة",
            ContentType.Video,
            "https://www.youtube.com/watch?v=mk8tOD0t8M0"),
        new("الاحتمالات - الأساسيات",
            "فضاء العينة والأحداث وحساب الاحتمالات",
            ContentType.Video,
            "https://www.youtube.com/watch?v=uzkc-qNVoOk"),
        new("ملزمة الإحصاء والاحتمال",
            "نماذج امتحانات بالحلول في الإحصاء",
            ContentType.Pdf,
            "https://drive.google.com/file/d/stat-notes/view"),
        new("مقال: تطبيقات الإحصاء في الحياة",
            "كيف يستخدم الإحصاء في مجالات الطب والاقتصاد",
            ContentType.Article,
            "https://ar.wikipedia.org/wiki/إحصاء"),
    ];

    private static LessonSpec[] PhysicsLessons() =>
    [
        new("الحركة والقوى - المراجعة الشاملة",
            "مراجعة قوانين نيوتن وتطبيقاتها",
            ContentType.Video,
            "https://www.youtube.com/watch?v=CQYgbe6p0ok"),
        new("الطاقة وتحولاتها",
            "قانون حفظ الطاقة وتطبيقاته في الفيزياء",
            ContentType.Video,
            "https://www.youtube.com/watch?v=Lwid9B0LXIA"),
        new("ملزمة الفيزياء - تالتة ثانوي",
            "الملزمة الشاملة بالنماذج والحلول",
            ContentType.Pdf,
            "https://drive.google.com/file/d/physics-notes/view"),
        new("تجارب الفيزياء التفاعلية",
            "محاكاة تجارب الفيزياء عبر الإنترنت",
            ContentType.Link,
            "https://phet.colorado.edu/ar/"),
    ];

    private static LessonSpec[] ElectroLessons() =>
    [
        new("الكهرباء الساكنة والمتحركة",
            "التيار الكهربي وقانون أوم",
            ContentType.Video,
            "https://www.youtube.com/watch?v=OGa_b26eK2I"),
        new("قانون فاراداي والحث الكهرومغناطيسي",
            "شرح الحث الكهرومغناطيسي والمولدات",
            ContentType.Video,
            "https://www.youtube.com/watch?v=N7tIi71-AjA"),
        new("ملزمة الكهرومغناطيسية",
            "الملزمة الكاملة للوحدة مع المسائل المحلولة",
            ContentType.Pdf,
            "https://drive.google.com/file/d/em-notes/view"),
        new("مقال: تطبيقات الكهرومغناطيسية",
            "الكهرومغناطيسية في التقنية الحديثة",
            ContentType.Article,
            "https://ar.wikipedia.org/wiki/كهرومغناطيسية"),
    ];

    private static LessonSpec[] MechanicsLessons() =>
    [
        new("الديناميكا - الحركة المستقيمة",
            "معادلات الحركة المنتظمة وغير المنتظمة",
            ContentType.Video,
            "https://www.youtube.com/watch?v=ZM8ECpBuQYE"),
        new("الحركة الدائرية والجاذبية",
            "الحركة في مسار دائري وقانون الجاذبية العالمي",
            ContentType.Video,
            "https://www.youtube.com/watch?v=3SqPTbFX06I"),
        new("ملزمة الميكانيكا",
            "نماذج وأسئلة على الميكانيكا الكلاسيكية",
            ContentType.Pdf,
            "https://drive.google.com/file/d/mechanics-notes/view"),
        new("محاكاة الحركة",
            "تجارب ميكانيكا تفاعلية",
            ContentType.Link,
            "https://phet.colorado.edu/ar/simulations/category/physics"),
    ];

    private static LessonSpec[] ArabicLessons() =>
    [
        new("النص الأول - قراءة وتحليل",
            "تحليل النص الأدبي وفهم المقروء",
            ContentType.Video,
            "https://www.youtube.com/watch?v=VLv29F28h9M"),
        new("قواعد الاشتقاق والتصريف",
            "الميزان الصرفي وأبنية الكلمات",
            ContentType.Video,
            "https://www.youtube.com/watch?v=4KQe0nPeHQE"),
        new("ملزمة اللغة العربية الشاملة",
            "الملزمة المرجعية لمنهج اللغة العربية",
            ContentType.Pdf,
            "https://drive.google.com/file/d/arabic-notes/view"),
        new("مقال: أهمية اللغة العربية",
            "اللغة العربية وعلاقتها بالهوية الحضارية",
            ContentType.Article,
            "https://ar.wikipedia.org/wiki/اللغة_العربية"),
    ];

    private static LessonSpec[] NahwLessons() =>
    [
        new("الجملة الاسمية والفعلية",
            "أركان الجملة وإعراب المبتدأ والخبر",
            ContentType.Video,
            "https://www.youtube.com/watch?v=5w2o1YHKZDQ"),
        new("الأفعال وأزمنتها",
            "الماضي والمضارع والأمر وحالات الإعراب",
            ContentType.Video,
            "https://www.youtube.com/watch?v=qCR6lXmKpnc"),
        new("ملزمة النحو والصرف",
            "جدول شامل للقواعد النحوية مع التدريبات",
            ContentType.Pdf,
            "https://drive.google.com/file/d/nahw-notes/view"),
        new("تدريبات نحوية تفاعلية",
            "أسئلة اختيارية على قواعد النحو",
            ContentType.Link,
            "https://www.arabacademy.com/grammar-exercises"),
    ];

    private static LessonSpec[] AdabLessons() =>
    [
        new("مدارس الشعر العربي الحديث",
            "الشعر الكلاسيكي والرومانسي والمهجري",
            ContentType.Video,
            "https://www.youtube.com/watch?v=BDdMrXCO7FI"),
        new("تحليل قصيدة - أحمد شوقي",
            "تحليل بلاغي لقصائد أمير الشعراء",
            ContentType.Video,
            "https://www.youtube.com/watch?v=X2Y3Z4A5B6C"),
        new("ملزمة الأدب والبلاغة",
            "شرح مصطلحات البلاغة وأبرز الشعراء",
            ContentType.Pdf,
            "https://drive.google.com/file/d/adab-notes/view"),
        new("مقال: تطور الأدب العربي",
            "نظرة تاريخية على الأدب العربي عبر العصور",
            ContentType.Article,
            "https://ar.wikipedia.org/wiki/الأدب_العربي"),
    ];

    private static LessonSpec[] BioLessons() =>
    [
        new("الخلية ووظائفها",
            "بنية الخلية الحيوانية والنباتية ومكوناتها",
            ContentType.Video,
            "https://www.youtube.com/watch?v=Hmwvj9X4GNY"),
        new("التمثيل الغذائي والطاقة",
            "التنفس الخلوي والبناء الضوئي",
            ContentType.Video,
            "https://www.youtube.com/watch?v=00jbG_cfGuQ"),
        new("ملزمة الأحياء الشاملة",
            "الملزمة الكاملة بالرسوم التوضيحية والأسئلة",
            ContentType.Pdf,
            "https://drive.google.com/file/d/bio-notes/view"),
        new("مقال: أهمية علم الأحياء",
            "تطبيقات علم الأحياء في الطب والبيئة",
            ContentType.Article,
            "https://ar.wikipedia.org/wiki/علم_الأحياء"),
    ];

    private static LessonSpec[] GeneticsLessons() =>
    [
        new("قوانين مندل في الوراثة",
            "الوراثة المتنحية والسائدة وجداول بانيت",
            ContentType.Video,
            "https://www.youtube.com/watch?v=CBezq1fFUEA"),
        new("الحمض النووي DNA والجينوم",
            "تركيب DNA والشيفرة الوراثية",
            ContentType.Video,
            "https://www.youtube.com/watch?v=zwibgNGe4aY"),
        new("ملزمة الوراثة والتطور",
            "ملخص وراثة كامل مع رسومات ونماذج",
            ContentType.Pdf,
            "https://drive.google.com/file/d/genetics-notes/view"),
        new("محاكاة تجارب الوراثة",
            "تجارب وراثة تفاعلية",
            ContentType.Link,
            "https://phet.colorado.edu/ar/simulations/gene-expression-essentials"),
    ];

    private static LessonSpec[] PhysioLessons() =>
    [
        new("الجهاز العصبي - بنية ووظيفة",
            "الخلايا العصبية ومسارات الإشارة العصبية",
            ContentType.Video,
            "https://www.youtube.com/watch?v=jLN0BQEL_Gc"),
        new("الجهاز الدوري والقلب",
            "الدورة الدموية الكبرى والصغرى ووظيفة القلب",
            ContentType.Video,
            "https://www.youtube.com/watch?v=CWFyxn0qDEU"),
        new("ملزمة فسيولوجيا الإنسان",
            "الملزمة الشاملة بأسئلة على الجهازين العصبي والدوري",
            ContentType.Pdf,
            "https://drive.google.com/file/d/physio-notes/view"),
        new("مقال: مستجدات علم الفسيولوجيا",
            "أحدث الاكتشافات في فسيولوجيا الإنسان",
            ContentType.Article,
            "https://ar.wikipedia.org/wiki/فيزيولوجيا"),
    ];

    // ─────────────────────────────────────────────────────────────
    //  Record types (spec / data-only structs)
    // ─────────────────────────────────────────────────────────────
    private record TenantSpec(
        string Subdomain,
        string Name,
        string PrimaryColor,
        string Bio,
        string TeacherEmail,
        string TeacherName,
        string LogoUrl,
        SubjectSpec[] Subjects,
        string[] StudentEmails);

    private record SubjectSpec(
        string Title,
        string Description,
        string ThumbnailUrl,
        bool IsPublished,
        GroupSpec[] Groups,
        LessonSpec[] Lessons);

    private record GroupSpec(string Code, string Name, string Schedule);

    private record LessonSpec(
        string Title,
        string Description,
        ContentType ContentType,
        string ContentUrl);
}
