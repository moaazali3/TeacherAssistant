using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class GroupMembershipConfiguration : IEntityTypeConfiguration<GroupMembership>
{
    public void Configure(EntityTypeBuilder<GroupMembership> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.JoinedAt)
            .IsRequired();

        // One group per subject per student. SubjectId is denormalized and carries no FK.
        builder.HasIndex(m => new { m.StudentId, m.SubjectId })
            .IsUnique();

        builder.HasIndex(m => m.GroupId);
        builder.HasIndex(m => m.SubjectId);

        builder.HasOne(m => m.Student)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey(m => m.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
