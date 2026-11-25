using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class LessonPurchaseConfiguration : IEntityTypeConfiguration<LessonPurchase>
{
    public void Configure(EntityTypeBuilder<LessonPurchase> builder)
    {
        builder.HasKey(lp => lp.Id);

        builder.Property(lp => lp.Amount)
            .HasPrecision(18, 2);

        builder.Property(lp => lp.PaymentProvider)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(lp => lp.ReferenceCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(lp => lp.ReferenceCode)
            .IsUnique();

        builder.HasIndex(lp => new { lp.TenantId, lp.StudentId, lp.LessonId });

        builder.HasOne(lp => lp.Lesson)
            .WithMany()
            .HasForeignKey(lp => lp.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict avoids SQL Server multiple cascade paths (error 1785).
        builder.HasOne(lp => lp.Student)
            .WithMany()
            .HasForeignKey(lp => lp.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
