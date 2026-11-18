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

        if (demoTenant is null)
        {
            demoTenant = new Tenant
            {
                Name = string.IsNullOrWhiteSpace(_settings.DemoTenantName) ? "أكاديمية الكيمياء" : _settings.DemoTenantName,
                Subdomain = demoSubdomain,
                PrimaryColor = _settings.DemoPrimaryColor ?? "#0F766E",
                Bio = _settings.DemoBio ?? "منصة تعليمية متخصصة في شرح ومراجعة الكيمياء للثانوية العامة."
            };
            _context.Tenants.Add(demoTenant);
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
                Name = string.IsNullOrWhiteSpace(_settings.DemoTeacherName) ? "أ. أحمد محمد" : _settings.DemoTeacherName,
                Email = teacherEmail,
                Role = UserRole.Instructor,
                TenantId = demoTenant.Id
            };
            teacher.PasswordHash = _passwordHasher.HashPassword(teacher, _settings.DemoTeacherPassword);
            _context.Users.Add(teacher);
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
        var lessonSeeds = new[]
        {
            (
                Title: "مقدمة الكيمياء العضوية وتصنيف الهيدروكربونات",
                Description: "شرح تفصيلي للمفاهيم التأسيسية للكيمياء العضوية، الصيغ الجزيئية والبنائية وتصنيف المركبات الهيدروكربونية.",
                Type: ContentType.Video,
                Url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                Order: 1
            ),
            (
                Title: "ملخص قوانين الكيمياء الكهربية وخلايا فاراداي",
                Description: "ملف تجميعي ومراجعة مركزة لقوانين التحليل الكهربي وتطبيقات الخلايا الجلفانية والإلكتروليتية.",
                Type: ContentType.Link,
                Url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view",
                Order: 2
            ),
            (
                Title: "بنك أسئلة وتدريبات الاتزان الكيميائي (PDF)",
                Description: "مذكرة تدريبات شاملة مع نماذج الإجابة النموذجية وتطبيقات قاعدة لوشاتيليه وحسابات ثابت الاتزان.",
                Type: ContentType.Pdf,
                Url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                Order: 3
            ),
            (
                Title: "دليل إتقان مسائل الكيمياء التحليلية والمعايرة",
                Description: "مقال إرشادي يشرح استراتيجيات حل مسائل التحليل الكمي الحجمي والتطاير والترسيب خطوة بخطوة.",
                Type: ContentType.Article,
                Url: "https://en.wikipedia.org/wiki/Analytical_chemistry",
                Order: 4
            )
        };

        foreach (var seed in lessonSeeds)
        {
            var exists = await _context.Lessons
                .IgnoreQueryFilters()
                .AnyAsync(l => l.SubjectId == subjectId && l.Title == seed.Title, cancellationToken);

            if (!exists)
            {
                _context.Lessons.Add(new Lesson
                {
                    TenantId = tenantId,
                    SubjectId = subjectId,
                    Title = seed.Title,
                    Description = seed.Description,
                    ContentType = seed.Type,
                    ContentUrl = seed.Url,
                    SortOrder = seed.Order,
                    IsPublished = true
                });
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
