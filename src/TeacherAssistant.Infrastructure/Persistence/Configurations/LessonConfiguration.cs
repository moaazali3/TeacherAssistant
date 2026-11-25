using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(l => l.Description)
            .HasMaxLength(2000);

        builder.Property(l => l.ContentUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(l => l.SortOrder)
            .IsRequired();

        builder.Property(l => l.IsPublished)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(l => l.Price)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(l => l.ModuleTitle)
            .HasMaxLength(150);

        builder.Property(l => l.AttachmentUrl)
            .HasMaxLength(500);

        builder.HasIndex(l => new { l.SubjectId, l.SortOrder });

        builder.HasMany(l => l.Quizzes)
            .WithOne(q => q.Lesson)
            .HasForeignKey(q => q.LessonId)
            // NoAction avoids SQL Server's "multiple cascade paths" error:
            // quizzes already cascade from Subject, and lessons cascade from Subject.
            .OnDelete(DeleteBehavior.NoAction);
    }
}
