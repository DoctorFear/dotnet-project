using System;
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

        // New DbSets for Inventory, Supplier & Stock Alert Modules
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
        public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();
        public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
        public DbSet<StockAlert> StockAlerts => Set<StockAlert>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Users Entity Configuration
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

                entity.HasIndex(u => u.Username).IsUnique().HasDatabaseName("IX_Users_Username");
                entity.HasIndex(u => u.Email).IsUnique().HasDatabaseName("IX_Users_Email");
            });

            // 2. AuditLogs Configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AuditLogs");
                entity.HasKey(a => a.Id);
                entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
                entity.Property(a => a.EntityName).IsRequired().HasMaxLength(100);
                entity.Property(a => a.Details).HasMaxLength(1000);
                entity.HasIndex(a => a.Timestamp).HasDatabaseName("IX_AuditLogs_Timestamp");
            });

            // 3. Order configuration
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

            // 4. OrderItems Configuration
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

            // 5. Books Configuration
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

            // 6. Inventories Configuration
            modelBuilder.Entity<Inventory>(entity =>
            {
                entity.ToTable("Inventories");
                entity.HasKey(i => i.Id);
                entity.Property(i => i.QuantityOnHand).IsRequired().HasDefaultValue(0);
                entity.Property(i => i.ReorderLevel).IsRequired().HasDefaultValue(5);
                entity.Property(i => i.LastUpdated).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(i => i.BookId).IsUnique(); // 1:1

                entity.HasOne(i => i.Book)
                    .WithOne()
                    .HasForeignKey<Inventory>(i => i.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 7. BookCategories Configuration
            modelBuilder.Entity<BookCategory>(entity =>
            {
                entity.ToTable("BookCategories");
                entity.HasKey(bc => new { bc.BookId, bc.CategoryId }); // N:N

                entity.HasOne(bc => bc.Book)
                    .WithMany(b => b.BookCategories)
                    .HasForeignKey(bc => bc.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 8. Suppliers Configuration (Phục vụ UC11)
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("Suppliers");
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Name).IsRequired().HasMaxLength(255);
                entity.Property(s => s.ContactPerson).HasMaxLength(100);
                entity.Property(s => s.Phone).HasMaxLength(20);
                entity.Property(s => s.Email).HasMaxLength(150);
                entity.Property(s => s.Address).HasMaxLength(500);
            });

            // 9. PurchaseOrders Configuration (Phục vụ UC12, UC13)
            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.ToTable("PurchaseOrders");
                entity.HasKey(po => po.Id);
                entity.Property(po => po.Code).IsRequired().HasMaxLength(50);
                entity.HasIndex(po => po.Code).IsUnique().HasDatabaseName("IX_PurchaseOrders_Code");
                entity.Property(po => po.Status).IsRequired().HasMaxLength(30);
                entity.Property(po => po.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(po => po.Notes).HasMaxLength(500);

                entity.HasOne(po => po.Supplier)
                    .WithMany(s => s.PurchaseOrders)
                    .HasForeignKey(po => po.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 10. PurchaseOrderItems Configuration (Phục vụ UC12, UC13)
            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.ToTable("PurchaseOrderItems");
                entity.HasKey(poi => poi.Id);
                entity.Property(poi => poi.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
                entity.Property(poi => poi.OrderedQuantity).IsRequired();
                entity.Property(poi => poi.ReceivedQuantity).IsRequired();

                entity.HasOne(poi => poi.PurchaseOrder)
                    .WithMany(po => po.Items)
                    .HasForeignKey(poi => poi.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Book>()
                    .WithMany()
                    .HasForeignKey(poi => poi.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 11. StockMovements Configuration (Phục vụ UC13 - Biến động kho)
            modelBuilder.Entity<StockMovement>(entity =>
            {
                entity.ToTable("StockMovements");
                entity.HasKey(sm => sm.Id);
                entity.Property(sm => sm.MovementType).IsRequired().HasMaxLength(50);
                entity.Property(sm => sm.Reason).HasMaxLength(255);

                entity.HasIndex(sm => sm.BookId).HasDatabaseName("IX_StockMovements_BookId");

                entity.HasOne<Book>()
                    .WithMany()
                    .HasForeignKey(sm => sm.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 12. SystemSettings Configuration (Phục vụ Cảnh báo tồn kho)
            modelBuilder.Entity<SystemSetting>(entity =>
            {
                entity.ToTable("SystemSettings");
                entity.HasKey(ss => ss.Id);
                entity.Property(ss => ss.SettingKey).IsRequired().HasMaxLength(100);
                entity.HasIndex(ss => ss.SettingKey).IsUnique().HasDatabaseName("IX_SystemSettings_SettingKey");
                entity.Property(ss => ss.SettingValue).IsRequired().HasMaxLength(500);
                entity.Property(ss => ss.Description).HasMaxLength(255);
            });

            // 13. StockAlerts Configuration (Phục vụ Cảnh báo tồn kho)
            modelBuilder.Entity<StockAlert>(entity =>
            {
                entity.ToTable("StockAlerts");
                entity.HasKey(sa => sa.Id);
                entity.Property(sa => sa.Status).IsRequired().HasMaxLength(30);

                entity.HasIndex(sa => sa.IsResolved).HasDatabaseName("IX_StockAlerts_IsResolved");

                entity.HasOne<Book>()
                    .WithMany()
                    .HasForeignKey(sa => sa.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Data test mẫu
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