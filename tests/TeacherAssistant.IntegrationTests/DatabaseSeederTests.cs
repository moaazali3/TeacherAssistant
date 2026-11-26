using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TeacherAssistant.Domain.Enums;
using TeacherAssistant.Infrastructure.Persistence;

namespace TeacherAssistant.IntegrationTests;

public class DatabaseSeederTests
{
    [Fact]
    public async Task Seeding_creates_demo_data_and_places_students_in_correct_groups()
    {
        var factory = new ApiFactory(new Dictionary<string, string?>
        {
            ["Seed:DemoData"] = "true"
        });

        await factory.InitializeDatabaseAsync();

        using (var scope = factory.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
        }

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // 1. Verify Demo Tenant
            var demoTenant = await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == "demo");
            Assert.NotNull(demoTenant);

            // 2. Verify Demo Teacher
            var teacher = await db.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.TenantId == demoTenant.Id && u.Email == "teacher@demo.local");
            Assert.NotNull(teacher);
            Assert.Equal(UserRole.Instructor, teacher.Role);

            // 3. Verify Primary Subject ("كيمياء - تالتة ثانوي") & 5 Enriched Lessons + Assessments
            var subject = await db.Subjects
                .IgnoreQueryFilters()
                .Include(s => s.Lessons)
                .Include(s => s.Quizzes)
                .FirstOrDefaultAsync(s => s.TenantId == demoTenant.Id && s.Title == "كيمياء - تالتة ثانوي");
            Assert.NotNull(subject);
            Assert.True(subject.IsPublished);
            Assert.Equal("الصف الثالث الثانوي", subject.GradeLevel);
            Assert.Equal(5, subject.Lessons.Count);
            Assert.All(subject.Lessons, l => Assert.True(l.IsPublished));
            Assert.All(subject.Lessons, l => Assert.False(string.IsNullOrWhiteSpace(l.ModuleTitle)));
            Assert.Contains(subject.Lessons, l => l.Price == 50m);
            Assert.Equal(3, subject.Quizzes.Count);
            Assert.All(subject.Quizzes, q => Assert.NotNull(q.LessonId));

            // Verify the lessons content types (Video, Link, Pdf, Article)
            var lessonTypes = subject.Lessons.Select(l => l.ContentType).ToList();
            Assert.Contains(ContentType.Video, lessonTypes);
            Assert.Contains(ContentType.Link, lessonTypes);
            Assert.Contains(ContentType.Pdf, lessonTypes);
            Assert.Contains(ContentType.Article, lessonTypes);

            // 4. Verify 1 Draft Subject
            var draftSubject = await db.Subjects
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.TenantId == demoTenant.Id && !s.IsPublished);
            Assert.NotNull(draftSubject);

            // 5. Verify Groups
            var satGroup = await db.Groups
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(g => g.TenantId == demoTenant.Id && g.JoinCode == "SAT5CHEM");
            Assert.NotNull(satGroup);

            var mndGroup = await db.Groups
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(g => g.TenantId == demoTenant.Id && g.JoinCode == "MND7CHEM");
            Assert.NotNull(mndGroup);

            // 6. Verify 3 Students and Group Allocations:
            // student1 & student3 in SAT5CHEM, student2 in MND7CHEM
            var student1 = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "student1@demo.local");
            Assert.NotNull(student1);
            Assert.Equal(UserRole.Student, student1.Role);

            var student2 = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "student2@demo.local");
            Assert.NotNull(student2);
            Assert.Equal(UserRole.Student, student2.Role);

            var student3 = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "student3@demo.local");
            Assert.NotNull(student3);
            Assert.Equal(UserRole.Student, student3.Role);

            var mem1 = await db.GroupMemberships.IgnoreQueryFilters()
                .FirstOrDefaultAsync(m => m.StudentId == student1.Id && m.SubjectId == subject.Id);
            Assert.NotNull(mem1);
            Assert.Equal(satGroup.Id, mem1.GroupId);

            var mem2 = await db.GroupMemberships.IgnoreQueryFilters()
                .FirstOrDefaultAsync(m => m.StudentId == student2.Id && m.SubjectId == subject.Id);
            Assert.NotNull(mem2);
            Assert.Equal(mndGroup.Id, mem2.GroupId);

            var mem3 = await db.GroupMemberships.IgnoreQueryFilters()
                .FirstOrDefaultAsync(m => m.StudentId == student3.Id && m.SubjectId == subject.Id);
            Assert.NotNull(mem3);
            Assert.Equal(satGroup.Id, mem3.GroupId);
        }

        await factory.DisposeAsync();
    }

    [Fact]
    public async Task Seeding_twice_is_idempotent_and_does_not_create_duplicates()
    {
        var factory = new ApiFactory(new Dictionary<string, string?>
        {
            ["Seed:DemoData"] = "true"
        });

        await factory.InitializeDatabaseAsync();

        // Run seed 1st time
        using (var scope = factory.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
        }

        int userCount1, subjectCount1, lessonCount1, quizCount1, groupCount1, membershipCount1;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            userCount1 = await db.Users.IgnoreQueryFilters().CountAsync();
            subjectCount1 = await db.Subjects.IgnoreQueryFilters().CountAsync();
            lessonCount1 = await db.Lessons.IgnoreQueryFilters().CountAsync();
            quizCount1 = await db.Quizzes.IgnoreQueryFilters().CountAsync();
            groupCount1 = await db.Groups.IgnoreQueryFilters().CountAsync();
            membershipCount1 = await db.GroupMemberships.IgnoreQueryFilters().CountAsync();
        }

        // Run seed 2nd time
        using (var scope = factory.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
        }

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userCount2 = await db.Users.IgnoreQueryFilters().CountAsync();
            var subjectCount2 = await db.Subjects.IgnoreQueryFilters().CountAsync();
            var lessonCount2 = await db.Lessons.IgnoreQueryFilters().CountAsync();
            var quizCount2 = await db.Quizzes.IgnoreQueryFilters().CountAsync();
            var groupCount2 = await db.Groups.IgnoreQueryFilters().CountAsync();
            var membershipCount2 = await db.GroupMemberships.IgnoreQueryFilters().CountAsync();

            Assert.Equal(userCount1, userCount2);
            Assert.Equal(subjectCount1, subjectCount2);
            Assert.Equal(lessonCount1, lessonCount2);
            Assert.Equal(quizCount1, quizCount2);
            Assert.Equal(groupCount1, groupCount2);
            Assert.Equal(membershipCount1, membershipCount2);
        }

        await factory.DisposeAsync();
    }

    [Fact]
    public async Task Production_environment_never_seeds_demo_data()
    {
        var factory = new ApiFactory(new Dictionary<string, string?>
        {
            ["ASPNETCORE_ENVIRONMENT"] = "Production",
            ["Seed:DemoData"] = "true" // Even if true, production MUST NOT seed demo data
        });

        await factory.InitializeDatabaseAsync();

        using (var scope = factory.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
        }

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // No demo tenant, teacher, or students should be seeded
            var demoTenant = await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == "demo");
            Assert.Null(demoTenant);

            var demoUsers = await db.Users.IgnoreQueryFilters().Where(u => u.Email.Contains("@demo.local")).ToListAsync();
            Assert.Empty(demoUsers);
        }

        await factory.DisposeAsync();
    }
}
