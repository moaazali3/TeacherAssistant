using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Score)
            .HasPrecision(18, 2);

        builder.Property(s => s.AnswersData)
            .IsRequired(); // Stores JSON

        builder.Property(s => s.Feedback)
            .HasMaxLength(2000);
    }
}
