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

        builder.Property(l => l.VideoUrl)
            .HasMaxLength(500);

        builder.Property(l => l.AttachmentUrl)
            .HasMaxLength(500);

        builder.HasMany(l => l.Quizzes)
            .WithOne(q => q.Lesson)
            .HasForeignKey(q => q.LessonId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
