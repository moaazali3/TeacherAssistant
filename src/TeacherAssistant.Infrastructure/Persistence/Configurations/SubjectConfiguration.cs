using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Description)
            .HasMaxLength(2000);

        builder.Property(s => s.GradeLevel)
            .HasMaxLength(60);

        builder.Property(s => s.Price)
            .HasPrecision(18, 2);

        builder.Property(s => s.ThumbnailUrl)
            .HasMaxLength(500);

        builder.Property(s => s.IsPublished)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasMany(s => s.Lessons)
            .WithOne(l => l.Subject)
            .HasForeignKey(l => l.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Groups)
            .WithOne(g => g.Subject)
            .HasForeignKey(g => g.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Enrollments)
            .WithOne(e => e.Subject)
            .HasForeignKey(e => e.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Quizzes)
            .WithOne(q => q.Subject)
            .HasForeignKey(q => q.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
