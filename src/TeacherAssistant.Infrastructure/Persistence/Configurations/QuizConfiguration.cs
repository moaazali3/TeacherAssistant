using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.HasKey(q => q.Id);

        builder.Property(q => q.Title)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(q => q.QuestionsData)
            .IsRequired(); // Stores JSON

        builder.Property(q => q.TotalScore)
            .HasPrecision(18, 2);

        builder.HasMany(q => q.Submissions)
            .WithOne(s => s.Quiz)
            .HasForeignKey(s => s.QuizId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
