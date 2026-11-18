using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeacherAssistant.Domain.Entities;

namespace TeacherAssistant.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Subdomain)
            .IsRequired()
            .HasMaxLength(63);

        builder.HasIndex(t => t.Subdomain)
            .IsUnique();

        builder.Property(t => t.LogoUrl)
            .HasMaxLength(500);

        builder.Property(t => t.PrimaryColor)
            .HasMaxLength(9);

        builder.Property(t => t.Bio)
            .HasMaxLength(1000);

        builder.HasMany(t => t.Users)
            .WithOne(u => u.Tenant)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
