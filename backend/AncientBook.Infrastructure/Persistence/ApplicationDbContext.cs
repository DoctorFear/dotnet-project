using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<Book> Books => Set<Book>();
        public DbSet<Inventory> Inventories => Set<Inventory>();
        public DbSet<BookCategory> BookCategories => Set<BookCategory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Users Entity Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(u => u.Id);

                entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(150);
                entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.PhoneNumber).HasMaxLength(15);
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);

                // BR01: Đánh Unique Indexes chống trùng lặp dữ liệu định danh
                entity.HasIndex(u => u.Username).IsUnique().HasDatabaseName("IX_Users_Username");
                entity.HasIndex(u => u.Email).IsUnique().HasDatabaseName("IX_Users_Email");
            });

            // AuditLogs Configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AuditLogs");
                entity.HasKey(a => a.Id);
                entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
                entity.Property(a => a.EntityName).IsRequired().HasMaxLength(100);
                entity.Property(a => a.Details).HasMaxLength(1000);
                entity.HasIndex(a => a.Timestamp).HasDatabaseName("IX_AuditLogs_Timestamp");
            });

            // Oder configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Orders");
                entity.HasKey(o => o.Id);
                entity.Property(o => o.OrderDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(o => o.SubTotal).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(o => o.DiscountAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(o => o.FinalAmount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(o => o.ShippingAddress).IsRequired().HasMaxLength(500);
                entity.Property(o => o.Status).IsRequired().HasMaxLength(30);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(o => o.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // OrderItems Configuration
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.ToTable("OrderItems");
                entity.HasKey(oi => oi.Id);
                entity.Property(oi => oi.Quantity).IsRequired();
                entity.Property(oi => oi.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();

                entity.HasOne(oi => oi.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne<Book>()
                    .WithMany()
                    .HasForeignKey(oi => oi.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Books Configuration
            modelBuilder.Entity<Book>(entity =>
            {
                entity.ToTable("Books");
                entity.HasKey(b => b.Id);
                entity.Property(b => b.Isbn).IsRequired().HasMaxLength(20);
                entity.HasIndex(b => b.Isbn).IsUnique().HasDatabaseName("IX_Books_Isbn");
                entity.Property(b => b.Title).IsRequired().HasMaxLength(255);
                entity.Property(b => b.Author).IsRequired().HasMaxLength(255);
                entity.Property(b => b.Price).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(b => b.CoverUrl).HasMaxLength(500);
                entity.Property(b => b.Description).HasColumnType("text");
                entity.Property(b => b.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Inventories Configuration
            modelBuilder.Entity<Inventory>(entity =>
            {
                entity.ToTable("Inventories");
                entity.HasKey(i => i.Id);
                entity.Property(i => i.QuantityOnHand).IsRequired().HasDefaultValue(0);
                entity.Property(i => i.ReorderLevel).IsRequired().HasDefaultValue(5);
                entity.Property(i => i.LastUpdated).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(i => i.BookId).IsUnique(); // 1:1

                entity.HasOne(i => i.Book)
                    .WithOne(b => b.Inventory)
                    .HasForeignKey<Inventory>(i => i.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // BookCategories Configuration
            modelBuilder.Entity<BookCategory>(entity =>
            {
                entity.ToTable("BookCategories");
                entity.HasKey(bc => new { bc.BookId, bc.CategoryId }); // N:N

                entity.HasOne(bc => bc.Book)
                    .WithMany(b => b.BookCategories)
                    .HasForeignKey(bc => bc.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Data để test checkout xóa nếu muốn
            modelBuilder.Entity<Book>().HasData(
                new Book 
                { 
                    Id = 1, 
                    Isbn = "978-604-0-00000-1", 
                    Title = "Sách Cổ Mẫu", 
                    Author = "Tác Giả Cổ", 
                    Price = 100000, 
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) 
                }
            );
            
            modelBuilder.Entity<Inventory>().HasData(
                new Inventory 
                { 
                    Id = 1, 
                    BookId = 1, 
                    QuantityOnHand = 50, 
                    ReorderLevel = 5, 
                    LastUpdated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) 
                }
            );
        }
    }
}