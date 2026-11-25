using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class LessonProgressConfiguration : IEntityTypeConfiguration<LessonProgress>
{
    public void Configure(EntityTypeBuilder<LessonProgress> builder)
    {
        builder.HasKey(lp => lp.Id);

        builder.HasIndex(lp => new { lp.TenantId, lp.StudentId, lp.LessonId })
            .IsUnique();

        builder.HasOne(lp => lp.Lesson)
            .WithMany(l => l.ProgressRecords)
            .HasForeignKey(lp => lp.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict avoids multiple cascade paths in SQL Server (User also cascades elsewhere).
        builder.HasOne(lp => lp.Student)
            .WithMany()
            .HasForeignKey(lp => lp.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
