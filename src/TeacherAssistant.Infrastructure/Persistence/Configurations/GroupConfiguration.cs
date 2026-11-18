using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(g => g.ScheduleText)
            .HasMaxLength(500);

        builder.Property(g => g.JoinCode)
            .IsRequired()
            .HasMaxLength(8);

        builder.Property(g => g.IsCodeActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(g => g.IsOpen)
            .IsRequired()
            .HasDefaultValue(true);

        // Join codes are unique inside a tenant, not globally.
        builder.HasIndex(g => new { g.TenantId, g.JoinCode })
            .IsUnique();

        builder.HasIndex(g => g.SubjectId);

        builder.HasMany(g => g.Memberships)
            .WithOne(m => m.Group)
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
