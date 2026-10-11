using System;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;

namespace AncientBook.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext, IWorkflowDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginWorkflowTransactionAsync() =>
            Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        public Task LockOrderAsync(int id) => Database.ExecuteSqlInterpolatedAsync(
            $"SELECT [Id] FROM [Orders] WITH (UPDLOCK, HOLDLOCK) WHERE [Id] = {id}");
        public Task LockUserAsync(int id) => Database.ExecuteSqlInterpolatedAsync(
            $"SELECT [Id] FROM [Users] WITH (UPDLOCK, HOLDLOCK) WHERE [Id] = {id}");
        public Task LockBookAsync(int id) => Database.ExecuteSqlInterpolatedAsync(
            $"SELECT [Id] FROM [Books] WITH (UPDLOCK, HOLDLOCK) WHERE [Id] = {id}");

        public DbSet<User> Users => Set<User>();

        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<ChatSessionEvent> ChatSessionEvents => Set<ChatSessionEvent>();

        public DbSet<EbookEdition> EbookEditions => Set<EbookEdition>();
        public DbSet<BookEmbedding> BookEmbeddings => Set<BookEmbedding>();

        public DbSet<CopilotChatHistory> CopilotChatHistories => Set<CopilotChatHistory>();

        public DbSet<BookTtsSegment> BookTtsSegments { get; set; }

        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<Cart> Carts => Set<Cart>();
        public DbSet<CartItem> CartItems => Set<CartItem>();
        public DbSet<Book> Books => Set<Book>();
        public DbSet<Inventory> Inventories => Set<Inventory>();
        public DbSet<FPoints> FPoints => Set<FPoints>();
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

        // ===== UC21 - Book Reviews =====
        public DbSet<BookReview> BookReviews => Set<BookReview>();

        // ===== UC19 - Delivery =====
        public DbSet<FailureReason> FailureReasons => Set<FailureReason>();
        public DbSet<OrderFailureReason> OrderFailureReasons => Set<OrderFailureReason>();
        public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();

        // ===== UC22 - Membership =====
        public DbSet<MembershipTier> MembershipTiers => Set<MembershipTier>();
        public DbSet<TierHistory> TierHistories => Set<TierHistory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Shipper>().HasOne(s => s.User).WithMany()
                .HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Shipper>().HasIndex(s => s.UserId).IsUnique()
                .HasFilter("[UserId] IS NOT NULL");
            modelBuilder.Entity<Order>().Property(o => o.PackingIssue).HasMaxLength(1000);
            modelBuilder.Entity<FPoints>().Property(p => p.SourceKey).HasMaxLength(200);
            modelBuilder.Entity<FPoints>().Property(p => p.Description).HasMaxLength(1000);
            modelBuilder.Entity<FPoints>().HasIndex(p => p.SourceKey).IsUnique()
                .HasFilter("[SourceKey] IS NOT NULL");
            modelBuilder.Entity<FPoints>().HasIndex(p => new { p.UserId, p.CreatedAt });
            modelBuilder.Entity<FulfillmentNotification>(entity =>
            {
                entity.Property(n => n.Audience).HasMaxLength(20);
                entity.Property(n => n.Message).HasMaxLength(1000);
                entity.HasIndex(n => new { n.Audience, n.UserId, n.CreatedAt });
                entity.HasOne<User>().WithMany().HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne<Order>().WithMany().HasForeignKey(n => n.OrderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

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
                entity.Property(u => u.TotalSpent).HasPrecision(18, 2).HasDefaultValue(0);

                entity.HasIndex(u => u.Username).IsUnique().HasDatabaseName("IX_Users_Username");
                entity.HasIndex(u => u.Email).IsUnique().HasDatabaseName("IX_Users_Email");

                // UC22: Quan hệ 1-N với MembershipTier
                entity.HasOne(u => u.MembershipTier)
                    .WithMany(mt => mt.Users)
                    .HasForeignKey(u => u.MembershipTierId)
                    .OnDelete(DeleteBehavior.SetNull);
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

                entity.HasIndex(o => new { o.ShipperId, o.Status, o.CreatedAt })
                .HasDatabaseName("IX_Orders_ShipperId_Status_CreatedAt");

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

                entity.Property(b => b.PhysicalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.EBookPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.WeeklyRentalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.MonthlyRentalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(b => b.YearlyRentalPrice).HasColumnType("decimal(18,2)").HasDefaultValue(0);

                entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
                entity.Property(b => b.StockStatus).HasConversion<string>().HasMaxLength(20);

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

            // 17. FPoints Configuration
            modelBuilder.Entity<FPoints>(entity =>
            {
                entity.ToTable("FPoints");
                entity.HasKey(pi => pi.Id);
                
                entity.Property(pi => pi.PointUsed).IsRequired();

                entity.HasOne(pi => pi.user)
                    .WithMany() 
                    .HasForeignKey(pi => pi.UserId);

                entity.HasOne(pi => pi.order)
                    .WithMany() 
                    .HasForeignKey(pi => pi.OrderId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
            
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.ToTable("Carts");
                entity.HasKey(c => c.Id);

                entity.HasOne(c => c.User)
                    .WithMany()
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(c => c.UserId).IsUnique().HasDatabaseName("IX_Carts_UserId");
            });

            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.ToTable("CartItems");
                entity.HasKey(ci => ci.Id);
                entity.Property(ci => ci.Quantity).IsRequired();
                entity.Property(ci => ci.PurchaseType).HasConversion<string>().HasMaxLength(20);
                entity.Property(ci => ci.RentalDuration).HasConversion<string>().HasMaxLength(20);

                entity.HasIndex(ci => new { ci.CartId, ci.BookId, ci.PurchaseType }).IsUnique().HasDatabaseName("IX_CartItems_CartId_BookId_PurchaseType");

                entity.HasOne(ci => ci.Cart)
                    .WithMany(c => c.CartItems)
                    .HasForeignKey(ci => ci.CartId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ci => ci.Book)
                    .WithMany()
                    .HasForeignKey(ci => ci.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 18. Cấu hình ChatSession
            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.HasKey(e => e.Id);

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

                entity.HasIndex(e => new { e.Status, e.StaffId });
            });

            // 19. Cấu hình ChatMessage
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

                entity.HasIndex(e => new { e.ChatSessionId, e.CreatedAt });
            });

            // 20. Cấu hình ChatSessionEvent
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

                entity.HasIndex(e => new { e.ChatSessionId, e.CreatedAt });
            });

            // 21. Cấu hình BookTtsSegment (TỪ NHÓM)
            modelBuilder.Entity<BookTtsSegment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.EditionId, e.PageNumber, e.SegmentIndex });
                entity.Property(e => e.TextContent).IsRequired();
                entity.Property(e => e.AudioUrlFemale).HasMaxLength(1000);
                entity.Property(e => e.AudioUrlMale).HasMaxLength(1000);

                entity.HasOne(e => e.Edition)
                      .WithMany()
                      .HasForeignKey(e => e.EditionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // 22. BookReview Configuration (UC21)
            modelBuilder.Entity<BookReview>(entity =>
            {
                entity.ToTable("BookReviews", t =>
                {
                    t.HasCheckConstraint("CK_BookReview_Rating", "[Rating] BETWEEN 1 AND 5");
                });

                entity.HasKey(r => r.Id);

                entity.Property(r => r.Title).HasMaxLength(200);
                entity.Property(r => r.Content).HasMaxLength(4000);
                entity.Property(r => r.ImageUrls).HasMaxLength(2000);
                entity.Property(r => r.Status).HasConversion<int>();

                entity.HasIndex(r => new { r.BookId, r.Status }).HasDatabaseName("IX_BookReviews_Book_Status");
                entity.HasIndex(r => new { r.BookId, r.Rating }).HasDatabaseName("IX_BookReviews_Book_Rating");
                entity.HasIndex(r => new { r.UserId, r.BookId, r.OrderId }).IsUnique().HasDatabaseName("IX_BookReviews_User_Book_Order");
                entity.HasIndex(r => r.CreatedAt).HasDatabaseName("IX_BookReviews_CreatedAt");

                entity.HasOne(r => r.Book)
                    .WithMany()
                    .HasForeignKey(r => r.BookId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Order)
                    .WithMany()
                    .HasForeignKey(r => r.OrderId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // 23. FailureReason Configuration
            modelBuilder.Entity<FailureReason>(entity =>
            {
                entity.ToTable("FailureReasons");
                entity.HasKey(f => f.Id);
                entity.Property(f => f.ReasonText).IsRequired().HasMaxLength(200);
                entity.Property(f => f.Description).HasMaxLength(500);
                entity.HasIndex(f => f.ReasonText).IsUnique().HasDatabaseName("IX_FailureReasons_ReasonText");
            });

            // 24. OrderFailureReason Configuration
            modelBuilder.Entity<OrderFailureReason>(entity =>
            {
                entity.ToTable("OrderFailureReasons");
                entity.HasKey(ofr => ofr.Id);
                entity.Property(ofr => ofr.FailureNote).HasMaxLength(500);
                entity.Property(ofr => ofr.RecordedBy).HasMaxLength(100);

                entity.HasIndex(ofr => ofr.OrderId).HasDatabaseName("IX_OrderFailureReasons_OrderId");
                entity.HasIndex(ofr => ofr.FailureReasonId).HasDatabaseName("IX_OrderFailureReasons_FailureReasonId");

                entity.HasOne(ofr => ofr.Order)
                    .WithMany()
                    .HasForeignKey(ofr => ofr.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ofr => ofr.FailureReason)
                    .WithMany(fr => fr.OrderFailureReasons)
                    .HasForeignKey(ofr => ofr.FailureReasonId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 25. OrderStatusHistory Configuration
            modelBuilder.Entity<OrderStatusHistory>(entity =>
            {
                entity.ToTable("OrderStatusHistories");
                entity.HasKey(osh => osh.Id);
                entity.Property(osh => osh.Note).HasMaxLength(500);
                entity.Property(osh => osh.ChangedBy).HasMaxLength(100);
                entity.Property(osh => osh.IpAddress).HasMaxLength(50);
                entity.Property(osh => osh.FromStatus).HasConversion<int>();
                entity.Property(osh => osh.ToStatus).HasConversion<int>();

                entity.HasIndex(osh => new { osh.OrderId, osh.ChangedAt }).HasDatabaseName("IX_OrderStatusHistories_OrderId_ChangedAt");

                entity.HasOne(osh => osh.Order)
                    .WithMany()
                    .HasForeignKey(osh => osh.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // 26. MembershipTier Configuration
            modelBuilder.Entity<MembershipTier>(entity =>
            {
                entity.ToTable("MembershipTiers");
                entity.HasKey(mt => mt.Id);
                entity.Property(mt => mt.TierName).IsRequired().HasMaxLength(50);
                entity.Property(mt => mt.MinSpending).HasPrecision(18, 2);
                entity.Property(mt => mt.Benefits).HasMaxLength(1000);

                entity.HasIndex(mt => mt.TierName).IsUnique().HasDatabaseName("IX_MembershipTiers_TierName");
                entity.HasIndex(mt => mt.DisplayOrder).HasDatabaseName("IX_MembershipTiers_DisplayOrder");
            });

            // 27. TierHistory Configuration
            modelBuilder.Entity<TierHistory>(entity =>
            {
                entity.ToTable("TierHistories");
                entity.HasKey(th => th.Id);
                entity.Property(th => th.FromTier).IsRequired().HasMaxLength(50);
                entity.Property(th => th.ToTier).IsRequired().HasMaxLength(50);
                entity.Property(th => th.TotalSpendingAtChange).HasPrecision(18, 2);
                entity.Property(th => th.ChangedBy).HasMaxLength(100);
                entity.Property(th => th.Note).HasMaxLength(500);

                entity.HasIndex(th => new { th.UserId, th.ChangedAt }).HasDatabaseName("IX_TierHistories_UserId_ChangedAt");
                entity.HasIndex(th => th.TriggerOrderId).HasDatabaseName("IX_TierHistories_TriggerOrderId");

                entity.HasOne(th => th.User)
                    .WithMany()
                    .HasForeignKey(th => th.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(th => th.TriggerOrder)
                    .WithMany()
                    .HasForeignKey(th => th.TriggerOrderId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
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
