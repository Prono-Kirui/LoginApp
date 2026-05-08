using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("AspNetUsers");   // Keep default table name

            entity.Property(u => u.DisplayName)
                  .HasMaxLength(100);

            entity.Property(u => u.AvatarUrl)
                  .HasMaxLength(500);

            // Make Email unique
            entity.HasIndex(u => u.Email)
                  .IsUnique();
        });
    }
}