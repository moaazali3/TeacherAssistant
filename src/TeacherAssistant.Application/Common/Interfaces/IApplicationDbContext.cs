using Microsoft.EntityFrameworkCore;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Course> Courses { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<Quiz> Quizzes { get; }
    DbSet<Submission> Submissions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
