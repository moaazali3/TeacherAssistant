using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TeacherAssistant.Application.Common;
using TeacherAssistant.Application.Common.Interfaces;
using TeacherAssistant.Domain.Entities;
using TeacherAssistant.Domain.Enums;
using TeacherAssistant.Infrastructure.Settings;

namespace TeacherAssistant.Infrastructure.Persistence;

/// <summary>
/// Idempotently seeds a platform admin, one demo teacher tenant with realistic Arabic content,
/// 4 published lessons, 1 draft subject, 2 groups, and 3 demo students.
/// Runs ONLY when in Development or when Seed:DemoData=true. Never in Production.
/// </summary>
public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly SeedSettings _settings;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IOptions<SeedSettings> settings,
        IConfiguration configuration,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _settings = settings.Value;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var environmentName = _configuration["ASPNETCORE_ENVIRONMENT"]
            ?? _configuration["DOTNET_ENVIRONMENT"]
            ?? _configuration["Environment"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "Development";

        var isDevelopment = string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase);
        var isProduction = string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase);
        var isDemoExplicit = _settings.DemoData || _configuration.GetValue<bool>("Seed:DemoData");

        // NEVER seed demo accounts or demo data in Production.
        // In other environments, only run when explicitly in Development or when Seed:DemoData is true.
        if (isProduction || (!isDevelopment && !isDemoExplicit))
        {
            _logger.LogInformation("DatabaseSeeder: Seeding skipped for environment '{Environment}'.", environmentName);
            return;
        }

        // 1. Seed Platform Admin
        var adminEmail = NormalizeEmail(_settings.AdminEmail);
        var adminExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.TenantId == null && u.Email == adminEmail, cancellationToken);

        if (!adminExists)
        {
            var admin = new User
            {
                Name = _settings.AdminName,
                Email = adminEmail,
                Role = UserRole.Admin,
                TenantId = null
            };
            admin.PasswordHash = _passwordHasher.HashPassword(admin, _settings.AdminPassword);
            _context.Users.Add(admin);
        }

        // 2. Seed Demo Tenant
        var demoSubdomain = SubdomainRules.Normalize(_settings.DemoSubdomain);
        var demoTenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Subdomain == demoSubdomain, cancellationToken);

        const string defaultChemPortrait = "/images/teachers/teacher-chem.jpg";

        if (demoTenant is null)
        {
            demoTenant = new Tenant
            {
                Name = string.IsNullOrWhiteSpace(_settings.DemoTenantName) || _settings.DemoTenantName == "Demo Academy"
                    ? "منصة أ. طارق المنشاوي للكيمياء"
                    : _settings.DemoTenantName,
                Subdomain = demoSubdomain,
                PrimaryColor = _settings.DemoPrimaryColor ?? "#3730A3",
                LogoUrl = defaultChemPortrait,
                Bio = string.IsNullOrWhiteSpace(_settings.DemoBio) || _settings.DemoBio.Contains("demo teacher", StringComparison.OrdinalIgnoreCase)
                    ? "منصة أ. طارق المنشاوي لشرح ومراجعة الكيمياء للثانوية العامة والأزهرية — افهم الكيمياء صح وحل أصعب أفكار العضوية والكهربية والاتزان مع متابعة أسبوعية وامتحانات دورية."
                    : _settings.DemoBio
            };
            _context.Tenants.Add(demoTenant);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else if (demoTenant.Name == "Demo Academy" || demoTenant.Name.Contains("خالد صقر") || demoTenant.PrimaryColor == "#0F766E" || demoTenant.LogoUrl != defaultChemPortrait)
        {
            demoTenant.Name = "منصة أ. طارق المنشاوي للكيمياء";
            demoTenant.PrimaryColor = "#3730A3";
            demoTenant.LogoUrl = defaultChemPortrait;
            demoTenant.Bio = "منصة أ. طارق المنشاوي لشرح ومراجعة الكيمياء للثانوية العامة والأزهرية — افهم الكيمياء صح وحل أصعب أفكار العضوية والكهربية والاتزان مع متابعة أسبوعية وامتحانات دورية.";
            var refreshedLanding = LandingPageRules.CreateDefault(
                demoTenant.Name,
                demoTenant.Bio,
                demoTenant.PrimaryColor,
                demoTenant.LogoUrl);
            demoTenant.LandingPageJson = System.Text.Json.JsonSerializer.Serialize(
                refreshedLanding,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                });
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Seed Landing Page for Demo Tenant if empty or still carrying old strings
        if (string.IsNullOrWhiteSpace(demoTenant.LandingPageJson) || demoTenant.LandingPageJson.Contains("Demo Academy") || demoTenant.LandingPageJson.Contains("خالد صقر"))
        {
            var landingDto = LandingPageRules.CreateDefault(
                demoTenant.Name,
                demoTenant.Bio,
                demoTenant.PrimaryColor,
                demoTenant.LogoUrl);
            demoTenant.LandingPageJson = System.Text.Json.JsonSerializer.Serialize(
                landingDto,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                });
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 3. Seed Demo Teacher
        var teacherEmail = NormalizeEmail(_settings.DemoTeacherEmail);
        var teacher = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                u => u.TenantId == demoTenant.Id && u.Email == teacherEmail, cancellationToken);

        if (teacher is null)
        {
            teacher = new User
            {
                Name = string.IsNullOrWhiteSpace(_settings.DemoTeacherName) || _settings.DemoTeacherName == "Demo Teacher"
                    ? "أ. طارق المنشاوي"
                    : _settings.DemoTeacherName,
                Email = teacherEmail,
                Role = UserRole.Instructor,
                TenantId = demoTenant.Id
            };
            teacher.PasswordHash = _passwordHasher.HashPassword(teacher, _settings.DemoTeacherPassword);
            _context.Users.Add(teacher);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else if (teacher.Name == "Demo Teacher" || teacher.Name.Contains("خالد صقر"))
        {
            teacher.Name = "أ. طارق المنشاوي";
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 4. Seed Demo Subject, Groups, and Lessons
        var (mainSubject, groupOne, groupTwo) = await SeedDemoSubjectsAndGroupsAsync(demoTenant.Id, teacher.Id, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Seed Demo Students & Enrollments
        await SeedDemoStudentsAsync(demoTenant.Id, mainSubject.Id, groupOne, groupTwo, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Note: Passwords and join codes are intentionally omitted from logs per security specification.
        _logger.LogInformation(
            "Database seed completed. Admin: {AdminEmail}. Demo tenant: {Subdomain} (Teacher: {TeacherEmail}). " +
            "Subject: '{SubjectTitle}'. Students seeded: {StudentCount}.",
            adminEmail, demoSubdomain, teacherEmail, mainSubject.Title, 3);
    }

    private async Task<(Subject MainSubject, Group GroupOne, Group GroupTwo)> SeedDemoSubjectsAndGroupsAsync(
        Guid tenantId,
        Guid teacherId,
        CancellationToken cancellationToken)
    {
        const string primarySubjectTitle = "كيمياء - تالتة ثانوي";
        const string oldSubjectTitle = "Chemistry";

        // Check if subject exists under new or old title
        var subject = await _context.Subjects
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                s => s.TenantId == tenantId && s.InstructorId == teacherId &&
                     (s.Title == primarySubjectTitle || s.Title == oldSubjectTitle),
                cancellationToken);

        if (subject is null)
        {
            subject = new Subject
            {
                TenantId = tenantId,
                InstructorId = teacherId,
                Title = primarySubjectTitle,
                Description = "شرح منهج الكيمياء للثانوية العامة، يشمل الكيمياء العضوية والتحليلية والاتزان الكيميائي والكهربية.",
                GradeLevel = "الصف الثالث الثانوي",
                ThumbnailUrl = "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80",
                IsPublished = true
            };
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // Upgrade existing subject to realistic Arabic title and description
            subject.Title = primarySubjectTitle;
            subject.Description = "شرح منهج الكيمياء للثانوية العامة، يشمل الكيمياء العضوية والتحليلية والاتزان الكيميائي والكهربية.";
            subject.GradeLevel ??= "الصف الثالث الثانوي";
            subject.IsPublished = true;
            if (string.IsNullOrWhiteSpace(subject.ThumbnailUrl))
            {
                subject.ThumbnailUrl = "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80";
            }
        }

        // Seed 4 Published Lessons under the primary subject
        await SeedLessonsAsync(tenantId, subject.Id, cancellationToken);

        // Seed Draft Subject (requirement: "keep one draft subject")
        const string draftSubjectTitle = "مراجعة ليلة الامتحان في الفيزياء (مسودة)";
        var draftSubject = await _context.Subjects
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                s => s.TenantId == tenantId && s.InstructorId == teacherId && s.Title == draftSubjectTitle,
                cancellationToken);

        if (draftSubject is null)
        {
            _context.Subjects.Add(new Subject
            {
                TenantId = tenantId,
                InstructorId = teacherId,
                Title = draftSubjectTitle,
                Description = "بنك الأسئلة الشامل ونماذج الامتحانات التجريبية للفيزياء - قيد التجهيز والمراجعة.",
                GradeLevel = "الصف الثالث الثانوي",
                ThumbnailUrl = "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80",
                IsPublished = false
            });
        }

        // Seed Groups
        var groupOneCode = JoinCodeRules.Normalize(_settings.DemoGroupOneCode);
        var groupOne = await _context.Groups
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(g => g.TenantId == tenantId && g.JoinCode == groupOneCode, cancellationToken);

        if (groupOne is null)
        {
            groupOne = new Group
            {
                TenantId = tenantId,
                SubjectId = subject.Id,
                Name = "مجموعة السبت 5 مساءً",
                ScheduleText = "السبت من 5:00 إلى 7:00 مساءً",
                JoinCode = groupOneCode,
                IsCodeActive = true,
                IsOpen = true
            };
            _context.Groups.Add(groupOne);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            groupOne.Name = "مجموعة السبت 5 مساءً";
            groupOne.ScheduleText = "السبت من 5:00 إلى 7:00 مساءً";
            groupOne.SubjectId = subject.Id;
            groupOne.IsCodeActive = true;
            groupOne.IsOpen = true;
        }

        var groupTwoCode = JoinCodeRules.Normalize(_settings.DemoGroupTwoCode);
        var groupTwo = await _context.Groups
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(g => g.TenantId == tenantId && g.JoinCode == groupTwoCode, cancellationToken);

        if (groupTwo is null)
        {
            groupTwo = new Group
            {
                TenantId = tenantId,
                SubjectId = subject.Id,
                Name = "مجموعة الإثنين 7 مساءً",
                ScheduleText = "الإثنين من 7:00 إلى 9:00 مساءً",
                JoinCode = groupTwoCode,
                IsCodeActive = true,
                IsOpen = true
            };
            _context.Groups.Add(groupTwo);
            await _context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            groupTwo.Name = "مجموعة الإثنين 7 مساءً";
            groupTwo.ScheduleText = "الإثنين من 7:00 إلى 9:00 مساءً";
            groupTwo.SubjectId = subject.Id;
            groupTwo.IsCodeActive = true;
            groupTwo.IsOpen = true;
        }

        return (subject, groupOne, groupTwo);
    }

    private async Task SeedLessonsAsync(Guid tenantId, Guid subjectId, CancellationToken cancellationToken)
    {
        const string samplePdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

        var lessonSeeds = new[]
        {
            (
                Title: "مقدمة الكيمياء العضوية وتصنيف الهيدروكربونات",
                Description: "شرح تفصيلي للمفاهيم التأسيسية للكيمياء العضوية، الصيغ الجزيئية والبنائية وتصنيف المركبات الهيدروكربونية.",
                Type: ContentType.Video,
                Url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                Order: 1,
                ModuleTitle: "الباب الأول: الكيمياء العضوية والكهربية",
                AttachmentUrl: (string?)samplePdfUrl,
                Price: 0m
            ),
            (
                Title: "ملخص قوانين الكيمياء الكهربية وخلايا فاراداي",
                Description: "ملف تجميعي ومراجعة مركزة لقوانين التحليل الكهربي وتطبيقات الخلايا الجلفانية والإلكتروليتية.",
                Type: ContentType.Link,
                Url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view",
                Order: 2,
                ModuleTitle: "الباب الأول: الكيمياء العضوية والكهربية",
                AttachmentUrl: (string?)samplePdfUrl,
                Price: 0m
            ),
            (
                Title: "بنك أسئلة وتدريبات الاتزان الكيميائي (PDF)",
                Description: "مذكرة تدريبات شاملة مع نماذج الإجابة النموذجية وتطبيقات قاعدة لوشاتيليه وحسابات ثابت الاتزان.",
                Type: ContentType.Pdf,
                Url: samplePdfUrl,
                Order: 3,
                ModuleTitle: "الباب الثاني: الاتزان والتحليل الكيميائي",
                AttachmentUrl: (string?)null,
                Price: 0m
            ),
            (
                Title: "دليل إتقان مسائل الكيمياء التحليلية والمعايرة",
                Description: "مقال إرشادي يشرح استراتيجيات حل مسائل التحليل الكمي الحجمي والتطاير والترسيب خطوة بخطوة.",
                Type: ContentType.Article,
                Url: "https://en.wikipedia.org/wiki/Analytical_chemistry",
                Order: 4,
                ModuleTitle: "الباب الثاني: الاتزان والتحليل الكيميائي",
                AttachmentUrl: (string?)samplePdfUrl,
                Price: 0m
            ),
            (
                Title: "محاضرة المراجعة المكثفة وحل كتاب مندليف",
                Description: "حصة شاملة لحل أصعب أفكار كتاب مندليف والامتحان مع مذكرة التوقعات النهائية.",
                Type: ContentType.Video,
                Url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                Order: 5,
                ModuleTitle: "الباب الثاني: الاتزان والتحليل الكيميائي",
                AttachmentUrl: (string?)samplePdfUrl,
                Price: 50m
            )
        };

        var seededLessons = new Dictionary<int, Lesson>();
        foreach (var seed in lessonSeeds)
        {
            var lesson = await _context.Lessons
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(l => l.SubjectId == subjectId && l.Title == seed.Title, cancellationToken);

            if (lesson is null)
            {
                lesson = new Lesson
                {
                    TenantId = tenantId,
                    SubjectId = subjectId,
                    Title = seed.Title,
                    Description = seed.Description,
                    ContentType = seed.Type,
                    ContentUrl = seed.Url,
                    SortOrder = seed.Order,
                    ModuleTitle = seed.ModuleTitle,
                    AttachmentUrl = seed.AttachmentUrl,
                    Price = seed.Price,
                    IsPublished = true
                };
                _context.Lessons.Add(lesson);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(lesson.ModuleTitle))
                    lesson.ModuleTitle = seed.ModuleTitle;
                if (string.IsNullOrWhiteSpace(lesson.AttachmentUrl) && !string.IsNullOrWhiteSpace(seed.AttachmentUrl))
                    lesson.AttachmentUrl = seed.AttachmentUrl;
                if (seed.Price > 0m && lesson.Price == 0m)
                    lesson.Price = seed.Price;
            }

            seededLessons[seed.Order] = lesson;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await SeedDemoAssessmentsAsync(tenantId, subjectId, seededLessons, cancellationToken);
    }

    private async Task SeedDemoAssessmentsAsync(
        Guid tenantId,
        Guid subjectId,
        IReadOnlyDictionary<int, Lesson> seededLessons,
        CancellationToken cancellationToken)
    {
        var jsonOptions = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        };

        var assessments = new[]
        {
            (
                Title: "واجب المحاضرة الأولى: أساسيات الكيمياء العضوية",
                Type: AssessmentType.Homework,
                DurationMinutes: (int?)null,
                PassingScorePercent: 50,
                LessonId: seededLessons.TryGetValue(1, out var l1) ? (Guid?)l1.Id : null,
                Questions: new[]
                {
                    new
                    {
                        id = "chem-hw1-q1",
                        prompt = "ما الصيغة العامة للألكانات الحلقية المشبعة؟",
                        options = new[] { "CnH2n+2", "CnH2n", "CnH2n-2", "CnHn" },
                        correctOptionIndex = 1,
                        points = 5m
                    },
                    new
                    {
                        id = "chem-hw1-q2",
                        prompt = "أول مركب عضوي تم تحضيره معملياً بواسطة العالم فوهلر هو:",
                        options = new[] { "الميثان", "حمض الأسيتيك", "اليوريا", "الإيثانول" },
                        correctOptionIndex = 2,
                        points = 5m
                    },
                    new
                    {
                        id = "chem-hw1-q3",
                        prompt = "عدد روابط سيجما (σ) في جزيء الإيثان (C2H6) يساوي:",
                        options = new[] { "5 روابط", "6 روابط", "7 روابط", "8 روابط" },
                        correctOptionIndex = 2,
                        points = 5m
                    }
                }
            ),
            (
                Title: "امتحان تقييمي سريع: الهيدروكربونات",
                Type: AssessmentType.Exam,
                DurationMinutes: (int?)15,
                PassingScorePercent: 60,
                LessonId: seededLessons.TryGetValue(1, out var l1b) ? (Guid?)l1b.Id : null,
                Questions: new[]
                {
                    new
                    {
                        id = "chem-ex1-q1",
                        prompt = "أي من المركبات التالية يزيل لون ماء البروم الأحمر؟",
                        options = new[] { "الإيثان", "الإيثيلين", "البروبان", "الميثان" },
                        correctOptionIndex = 1,
                        points = 5m
                    },
                    new
                    {
                        id = "chem-ex1-q2",
                        prompt = "التهجين الحادث في ذرتي الكربون في جزيء الإيثاين (الأسيتيلين) من النوع:",
                        options = new[] { "sp3", "sp2", "sp", "sd2" },
                        correctOptionIndex = 2,
                        points = 5m
                    },
                    new
                    {
                        id = "chem-ex1-q3",
                        prompt = "عند الهيدرة الحفزية للإيثاين في وجود حمض الكبريتيك وكبريتات الزئبق يتكون أولاً:",
                        options = new[] { "كحول الفاينيل غير الثابت", "الإيثانول", "حمض الخليك", "الأسيتون" },
                        correctOptionIndex = 0,
                        points = 5m
                    }
                }
            ),
            (
                Title: "واجب المحاضرة الثانية: قوانين فاراداي والخلايا الجلفانية",
                Type: AssessmentType.Homework,
                DurationMinutes: (int?)null,
                PassingScorePercent: 50,
                LessonId: seededLessons.TryGetValue(2, out var l2) ? (Guid?)l2.Id : null,
                Questions: new[]
                {
                    new
                    {
                        id = "chem-hw2-q1",
                        prompt = "في الخلية الجلفانية، تحدث عملية الأكسدة دائماً عند:",
                        options = new[] { "الكاثود (القطب الموجب)", "الأنود (القطب السالب)", "القنطرة الملحية", "الإلكتروليت فقط" },
                        correctOptionIndex = 1,
                        points = 5m
                    },
                    new
                    {
                        id = "chem-hw2-q2",
                        prompt = "كمية الكهربية اللازمة لترسيب جرام/ذرة من فلز ثنائي التكافؤ تساوي:",
                        options = new[] { "1 فاراداي", "2 فاراداي", "3 فاراداي", "96500 فاراداي" },
                        correctOptionIndex = 1,
                        points = 5m
                    }
                }
            )
        };

        foreach (var item in assessments)
        {
            var existing = await _context.Quizzes
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(q => q.SubjectId == subjectId && q.Title == item.Title, cancellationToken);

            if (existing is null)
            {
                var totalScore = item.Questions.Sum(q => q.points);
                _context.Quizzes.Add(new Quiz
                {
                    TenantId = tenantId,
                    SubjectId = subjectId,
                    LessonId = item.LessonId,
                    Title = item.Title,
                    Type = item.Type,
                    DurationMinutes = item.DurationMinutes,
                    PassingScorePercent = item.PassingScorePercent,
                    IsPublished = true,
                    QuestionsData = System.Text.Json.JsonSerializer.Serialize(item.Questions, jsonOptions),
                    TotalScore = totalScore
                });
            }
            else if (existing.LessonId is null && item.LessonId is not null)
            {
                existing.LessonId = item.LessonId;
            }
        }
    }

    private async Task SeedDemoStudentsAsync(
        Guid tenantId,
        Guid subjectId,
        Group groupOne,
        Group groupTwo,
        CancellationToken cancellationToken)
    {
        const string studentPassword = "Demo@12345";

        var studentSeeds = new[]
        {
            (Email: "student1@demo.local", Name: "أحمد علي", TargetGroup: groupOne),
            (Email: "student2@demo.local", Name: "مريم حسن", TargetGroup: groupTwo),
            (Email: "student3@demo.local", Name: "عمر خالد", TargetGroup: groupOne)
        };

        foreach (var seed in studentSeeds)
        {
            var email = NormalizeEmail(seed.Email);

            var student = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == email, cancellationToken);

            if (student is null)
            {
                student = new User
                {
                    Name = seed.Name,
                    Email = email,
                    Role = UserRole.Student,
                    TenantId = tenantId
                };
                student.PasswordHash = _passwordHasher.HashPassword(student, studentPassword);
                _context.Users.Add(student);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Ensure student has membership in the target group for this subject
            var membership = await _context.GroupMemberships
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(m => m.StudentId == student.Id && m.SubjectId == subjectId, cancellationToken);

            if (membership is null)
            {
                _context.GroupMemberships.Add(new GroupMembership
                {
                    TenantId = tenantId,
                    GroupId = seed.TargetGroup.Id,
                    SubjectId = subjectId,
                    StudentId = student.Id,
                    JoinedAt = DateTime.UtcNow
                });
            }
            else if (membership.GroupId != seed.TargetGroup.Id)
            {
                membership.GroupId = seed.TargetGroup.Id;
            }
        }
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
