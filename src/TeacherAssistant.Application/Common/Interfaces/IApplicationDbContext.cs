using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<User> Users { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<LessonProgress> LessonProgresses { get; }
    DbSet<Group> Groups { get; }
    DbSet<GroupMembership> GroupMemberships { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<Quiz> Quizzes { get; }
    DbSet<Submission> Submissions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
