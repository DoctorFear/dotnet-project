using System;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;

namespace AncientBook.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();

        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<ChatSessionEvent> ChatSessionEvents => Set<ChatSessionEvent>();

        public DbSet<EbookEdition> EbookEditions => Set<EbookEdition>();
        public DbSet<EbookPreset> EbookPresets => Set<EbookPreset>();
        public DbSet<BookEmbedding> BookEmbeddings => Set<BookEmbedding>();

        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<Book> Books => Set<Book>();
        public DbSet<Inventory> Inventories => Set<Inventory>();
        public DbSet<BookCategory> BookCategories => Set<BookCategory>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Publisher> Publishers => Set<Publisher>();
        public DbSet<BookImage> BookImages => Set<BookImage>();
        public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

        // New DbSets for Inventory, Supplier & Stock Alert Modules
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>()  ;
        public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();
        public DbSet<StockAlert> StockAlerts => Set<StockAlert>();
        public DbSet<Shipper> Shippers => Set<Shipper>();

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
                entity.Property(e => e.PasswordHash).IsRequired(false);
                entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
                entity.Property(u => u.IsSuperAdmin).HasDefaultValue(false);

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

                entity.HasOne(o => o.User)
                    .WithMany()
                    .HasForeignKey(o => o.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            modelBuilder.Entity<Shipper>(entity =>
            {
                entity.ToTable("Shippers");
                entity.HasKey(s => s.Id);
                entity.Property(s => s.Name).IsRequired().HasMaxLength(100);
                entity.Property(s => s.Phone).IsRequired().HasMaxLength(20);
                entity.Property(s => s.Area).HasMaxLength(200);
                entity.Property(s => s.Status).HasMaxLength(30);
            });

            // Cấu hình Khóa ngoại ShipperId trong Order
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasOne(o => o.Shipper)
                      .WithMany(s => s.Orders)
                      .HasForeignKey(o => o.ShipperId)
                      .OnDelete(DeleteBehavior.SetNull);
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

                entity.HasOne(oi => oi.Book)
                    .WithMany(b => b.OrderItems)
                    .HasForeignKey(oi => oi.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 5. Inventories Configuration
            modelBuilder.Entity<Inventory>(entity =>
            {
                entity.ToTable("Inventories");
                entity.HasKey(i => i.Id);
                entity.Property(i => i.QuantityOnHand).IsRequired().HasDefaultValue(0);
                entity.Property(i => i.ReorderLevel).IsRequired().HasDefaultValue(5);
                entity.Property(i => i.LastUpdated).HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasIndex(i => i.BookId).IsUnique();

                entity.HasOne(i => i.Book)
                    .WithOne(b => b.Inventory)
                    .HasForeignKey<Inventory>(i => i.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 6. BookCategories Configuration
            modelBuilder.Entity<BookCategory>(entity =>
            {
                entity.ToTable("BookCategories");
                entity.HasKey(bc => new { bc.BookId, bc.CategoryId });

                entity.HasOne(bc => bc.Book)
                    .WithMany(b => b.BookCategories)
                    .HasForeignKey(bc => bc.BookId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(bc => bc.Category)
                    .WithMany(c => c.BookCategories)
                    .HasForeignKey(bc => bc.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 7. Categories Configuration 
            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("Categories");
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Name).IsRequired().HasMaxLength(150);
                entity.HasIndex(c => c.Name).IsUnique().HasDatabaseName("IX_Categories_Name");

                entity.HasOne<Category>()
                    .WithMany()
                    .HasForeignKey(c => c.ParentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 8. Publishers Configuration 
            modelBuilder.Entity<Publisher>(entity =>
            {
                entity.ToTable("Publishers");
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Name).IsRequired().HasMaxLength(200);
                entity.HasIndex(p => p.Name).IsUnique().HasDatabaseName("IX_Publishers_Name");
            });

            // 9. SystemSettings Configuration
            modelBuilder.Entity<SystemSetting>(entity =>
            {
                entity.ToTable("SystemSettings");
                entity.HasKey(s => s.Id);
                entity.Property(s => s.SettingKey).IsRequired().HasMaxLength(100);
                entity.HasIndex(s => s.SettingKey).IsUnique().HasDatabaseName("IX_SystemSettings_Key");
            });

            // 10. Supplier Configuration 
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

            // 11. PurchaseOrder Configuration
            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.ToTable("PurchaseOrders");
                entity.HasKey(po => po.Id);
                entity.Property(po => po.Code).IsRequired().HasMaxLength(50);
                entity.HasIndex(po => po.Code).IsUnique().HasDatabaseName("IX_PurchaseOrders_Code");
                entity.Property(po => po.Status).IsRequired().HasMaxLength(30);
                entity.Property(po => po.TotalAmount).HasPrecision(18, 2);
                entity.Property(po => po.Notes).HasMaxLength(500);

                entity.HasOne(po => po.Supplier)
                    .WithMany(s => s.PurchaseOrders)
                    .HasForeignKey(po => po.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 12. PurchaseOrderItem Configuration
            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.ToTable("PurchaseOrderItems");
                entity.HasKey(poi => poi.Id);
                entity.Property(poi => poi.OrderedQuantity).IsRequired();
                entity.Property(poi => poi.ReceivedQuantity).IsRequired();
                entity.Property(poi => poi.UnitPrice).HasPrecision(18, 2);

                entity.HasOne(poi => poi.PurchaseOrder)
                    .WithMany(po => po.Items)
                    .HasForeignKey(poi => poi.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(poi => poi.Book)
                    .WithMany()
                    .HasForeignKey(poi => poi.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 13. StockMovement Configuration
            modelBuilder.Entity<StockMovement>(entity =>
            {
                entity.ToTable("StockMovements");
                entity.HasKey(sm => sm.Id);
                entity.Property(sm => sm.MovementType).IsRequired().HasMaxLength(30);
                entity.Property(sm => sm.Reason).HasMaxLength(500);

                entity.HasOne<Book>()
                    .WithMany()
                    .HasForeignKey(sm => sm.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 14. StockAlert Configuration
            modelBuilder.Entity<StockAlert>(entity =>
            {
                entity.ToTable("StockAlerts");
                entity.HasKey(sa => sa.Id);
                entity.Property(sa => sa.Status).IsRequired().HasMaxLength(30);

                entity.HasOne<Book>()
                    .WithMany()
                    .HasForeignKey(sa => sa.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 15. Books Configuration 
            modelBuilder.Entity<Book>(entity =>
            {
                entity.ToTable("Books");
                entity.HasKey(b => b.Id);
                entity.Property(b => b.Isbn).IsRequired().HasMaxLength(20);
                entity.HasIndex(b => b.Isbn).IsUnique().HasDatabaseName("IX_Books_Isbn");
                entity.Property(b => b.Title).IsRequired().HasMaxLength(255);
                entity.Property(b => b.Author).IsRequired().HasMaxLength(255);
                entity.Property(b => b.CoverImg).HasMaxLength(500);

                // Cấu hình các mức giá Decimal
                entity.Property(b => b.PhysicalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.EBookPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.WeeklyRentalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.MonthlyRentalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.YearlyRentalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);

                entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
                entity.Property(b => b.StockStatus).HasConversion<string>().HasMaxLength(20);

                // Quan hệ với Publisher
                entity.HasOne(b => b.PublisherEntity)
                    .WithMany()
                    .HasForeignKey(b => b.PublisherId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // 16. BookImages Configuration (Gallery)
            modelBuilder.Entity<BookImage>(entity =>
            {
                entity.ToTable("BookImages");
                entity.HasKey(bi => bi.Id);
                entity.Property(bi => bi.ImageUrl).IsRequired().HasMaxLength(500);

                entity.HasOne(bi => bi.Book)
                    .WithMany(b => b.BookImages)
                    .HasForeignKey(bi => bi.BookId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 17. Cấu hình ChatSession
            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Optimistic concurrency token chống nhận trùng phiên (E1 UC24)
                entity.Property(e => e.RowVersion)
                      .IsRowVersion();

                entity.Property(e => e.InternalNote)
                      .HasMaxLength(1000);

                entity.HasOne(e => e.Customer)
                      .WithMany()
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Staff)
                      .WithMany()
                      .HasForeignKey(e => e.StaffId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Index phục vụ lọc hàng đợi theo 3 tab (Pending, Active, Closed)
                entity.HasIndex(e => new { e.Status, e.StaffId });
            });

            // 18. Cấu hình ChatMessage
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.AttachmentUrl)
                      .HasMaxLength(500);

                entity.HasOne(e => e.ChatSession)
                      .WithMany(s => s.Messages)
                      .HasForeignKey(e => e.ChatSessionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Sender)
                      .WithMany()
                      .HasForeignKey(e => e.SenderId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Index tối ưu truy vấn lịch sử tin nhắn theo thứ tự thời gian
                entity.HasIndex(e => new { e.ChatSessionId, e.CreatedAt });
            });

            // 19. Cấu hình ChatSessionEvent
            modelBuilder.Entity<ChatSessionEvent>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Note)
                      .HasMaxLength(500);

                entity.HasOne(e => e.ChatSession)
                      .WithMany(s => s.Events)
                      .HasForeignKey(e => e.ChatSessionId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Actor)
                      .WithMany()
                      .HasForeignKey(e => e.ActorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.PreviousStaff)
                      .WithMany()
                      .HasForeignKey(e => e.PreviousStaffId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.NextStaff)
                      .WithMany()
                      .HasForeignKey(e => e.NextStaffId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Index tối ưu truy vấn sự kiện của phiên theo thứ tự thời gian
                entity.HasIndex(e => new { e.ChatSessionId, e.CreatedAt });
            });

            // Data để test checkout xóa nếu muốn
            modelBuilder.Entity<Book>().HasData(
                new Book 
                { 
                    Id = 1, 
                    Isbn = "978-604-0-00000-1", 
                    Title = "Sách Cổ Mẫu", 
                    Author = "Tác Giả Cổ", 
                    PhysicalPrice = 100000,
                    EBookPrice = 50000,
                    WeeklyRentalPrice = 10000,
                    IsPhysicalAvailable = true,
                    IsEBookAvailable = true,
                    IsRentalAvailable = true,
                    CoverImg = "https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg",
                    CreatedAt = new DateTime(2026, 1, 1)
                }
            );

            modelBuilder.Entity<Inventory>().HasData(
                new Inventory
                {
                    Id = 1,
                    BookId = 1,
                    QuantityOnHand = 50,
                    ReorderLevel = 5,
                    CreatedAt = new DateTime(2026, 1, 1),
                    LastUpdated = new DateTime(2026, 1, 1)
                }
            );



        }

        // Tự động ghi vết Audit Trail (CreatedAt, UpdatedAt) khi gọi SaveChangesAsync
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = TimeZoneHelper.GetVietnamTime();
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
