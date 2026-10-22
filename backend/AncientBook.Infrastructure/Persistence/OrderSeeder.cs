using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence;

public static class OrderSeeder
{
    private const string SeedPrefix = "OrderSeeder:v1:";
    private const int ScenarioOffset = 2000;

    // Tạo đủ tình huống lịch sử cho member_an, không ghi đè đơn hoặc số dư đã có.
    public static async Task SeedAsync(ApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        await using var tx = await db.BeginWorkflowTransactionAsync();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == "member_an");
        if (user == null)
        {
            user = new User { Username = "member_an", Email = "member_an@ancientbook.com", FullName = "Nguyễn Văn An",
                PhoneNumber = "0903000001", Role = UserRole.Member, IsActive = true,
                PasswordHash = passwordHasher.HashPassword("Password@123"), CreatedBy = "OrderSeeder" };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }
        if (user.Role != UserRole.Member) throw new InvalidOperationException("member_an phải là tài khoản Member.");
        await db.LockUserAsync(user.Id);
        var books = await db.Books.AsNoTracking().Where(b => b.IsPhysicalAvailable && b.IsRentalAvailable)
            .OrderBy(b => b.Id).ToListAsync();
        if (books.Count < 3) { await tx.CommitAsync(); return; }
        var scenarios = new (int Code, string Format, bool Multiple, bool Old, bool Reviewed)[]
        {
            (0, "physical", false, false, false), (2, "mixed", true, false, false), (3, "online", true, false, false),
            (1, "physical", false, false, false), (21, "mixed", true, false, false),
            (4, "physical", false, false, false), (24, "mixed", true, false, false),
            (6, "physical", false, false, false), (26, "mixed", true, false, false),
            (8, "physical", false, false, false), (28, "physical", true, false, true), (14, "online", false, false, false),
            (17, "physical", true, true, true), (15, "online", false, true, false), (13, "mixed", true, true, true),
            (9, "physical", false, false, false), (29, "online", false, false, false), (49, "mixed", true, false, false),
            (16, "physical", false, false, false), (36, "mixed", true, false, false),
            (18, "physical", false, false, false), (38, "physical", true, false, true),
            (19, "physical", true, false, false), (39, "physical", false, false, true),
            (10, "physical", false, false, false), (30, "physical", true, false, true),
            (11, "physical", true, false, false), (31, "physical", false, false, false),
            (12, "physical", false, false, true), (32, "physical", true, false, false)
        };
        var expectedKeys = scenarios.Select(s => SeedPrefix + (ScenarioOffset + s.Code)).ToArray();
        var seeded = await db.Orders.Where(o => o.UserId == user.Id && o.CreatedBy != null && o.CreatedBy.StartsWith(SeedPrefix)).ToListAsync();
        var stale = seeded.Where(o => !expectedKeys.Contains(o.CreatedBy)).ToList();
        if (stale.Count > 0)
        {
            var ids = stale.Select(o => o.Id).ToArray();
            var reviews = await db.BookReviews.Where(r => r.OrderId.HasValue && ids.Contains(r.OrderId.Value)).ToListAsync();
            var points = await db.FPoints.Where(p => p.OrderId.HasValue && ids.Contains(p.OrderId.Value)).ToListAsync();
            var refunds = await db.Refunds.Where(r => ids.Contains(r.OrderId)).ToListAsync();
            if (reviews.Any(r => r.CreatedBy != "OrderSeeder") || points.Any(p => p.CreatedBy != "OrderSeeder" || p.PointUsed != 0) || refunds.Any(r => r.CreatedBy != "OrderSeeder"))
                throw new InvalidOperationException("Đơn seed cũ đã có giao dịch thực tế, cần kiểm tra trước khi thay bộ dữ liệu.");
            // Chỉ thay bộ đơn do OrderSeeder tạo cho member_an, giữ nguyên các đơn khác.
            db.BookReviews.RemoveRange(reviews);
            db.FPoints.RemoveRange(points);
            db.Refunds.RemoveRange(refunds);
            await db.SaveChangesAsync();
            db.Orders.RemoveRange(stale);
            await db.SaveChangesAsync();
        }
        var existing = seeded.Except(stale).Select(o => o.CreatedBy!).ToList();
        var now = TimeZoneHelper.GetVietnamTime();
        var returnSetting = await db.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.SettingKey == "MAX_RETURN_DAYS");
        var returnDays = int.TryParse(returnSetting?.SettingValue, out var days) && days > 0 ? days : 3;
        var random = new Random(20261022);
        var shuffled = scenarios.OrderBy(_ => random.Next()).ToArray();
        for (var index = 0; index < shuffled.Length; index++)
        {
            var sample = shuffled[index];
            var key = SeedPrefix + (ScenarioOffset + sample.Code);
            if (existing.Contains(key)) continue;
            var scenario = sample.Code % 20;
            var book = books[index % books.Count];
            var second = books[(index + 1) % books.Count];
            var mixed = sample.Format == "mixed";
            var online = sample.Format == "online";
            var state = scenario switch
            {
                0 or 2 or 3 => OrderStatus.Pending,
                1 => OrderStatus.Confirmed,
                4 or 5 => OrderStatus.Prepared,
                6 or 7 => OrderStatus.Shipping,
                9 or 16 => OrderStatus.Failed,
                10 => OrderStatus.ReturnRequested,
                11 => OrderStatus.ReturnApproved,
                12 => OrderStatus.Returned,
                _ => OrderStatus.Completed
            };
            var old = sample.Old;
            var completed = (old ? now.AddDays(-Math.Max(returnDays + 4, 35)) : now.AddHours(-6)).AddMinutes(-index * 7);
            var orderDate = state is OrderStatus.Pending or OrderStatus.Confirmed or OrderStatus.Prepared or OrderStatus.Shipping
                ? now.AddHours(-2).AddMinutes(-index) : completed.AddDays(-2);
            var hasReturn = scenario is 10 or 11 or 12 or 18 or 19;
            var order = new Order
            {
                UserId = user.Id, Status = state, IsPaid = online ? state == OrderStatus.Completed : mixed || index % 2 == 0 && state != OrderStatus.Failed || state is OrderStatus.Completed or OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.Returned,
                ShippingAddress = online ? string.Empty : "28 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
                OrderDate = orderDate, CreatedAt = orderDate, UpdatedAt = completed, CreatedBy = key
            };
            order.OrderItems.Add(new OrderItem
            {
                BookId = book.Id, Quantity = online ? 1 : index % 2 + 1,
                PurchaseType = online ? PurchaseType.Rental : PurchaseType.Physical,
                UnitPrice = online ? book.MonthlyRentalPrice : book.PhysicalPrice,
                RentalDuration = online ? RentalDurationType.Monthly : null,
                RentalStartDate = online && state == OrderStatus.Completed ? completed : null,
                RentalEndDate = online && state == OrderStatus.Completed ? completed.AddMonths(1) : null
            });
            if (mixed) order.OrderItems.Add(new OrderItem { BookId = second.Id, Quantity = 1,
                PurchaseType = PurchaseType.Rental, RentalDuration = RentalDurationType.Weekly,
                UnitPrice = second.WeeklyRentalPrice, RentalStartDate = state == OrderStatus.Completed ? completed : null, RentalEndDate = state == OrderStatus.Completed ? completed.AddDays(7) : null });
            if (online && sample.Multiple) order.OrderItems.Add(new OrderItem { BookId = second.Id, Quantity = 1,
                PurchaseType = PurchaseType.Rental, RentalDuration = RentalDurationType.Weekly, UnitPrice = second.WeeklyRentalPrice });
            if (!online && !mixed && sample.Multiple) order.OrderItems.Add(new OrderItem
            { BookId = second.Id, Quantity = 1, UnitPrice = second.PhysicalPrice, PurchaseType = PurchaseType.Physical });
            order.SubTotal = order.OrderItems.Sum(i => i.Quantity * i.UnitPrice);
            order.FinalAmount = order.SubTotal;
            db.Orders.Add(order);
            await db.SaveChangesAsync();
            void History(OrderStatus from, OrderStatus to, DateTime at, string? note = null) => db.OrderStatusHistories.Add(new OrderStatusHistory
            { OrderId = order.Id, FromStatus = from, ToStatus = to, ChangedAt = at, Note = note, ChangedBy = "OrderSeeder", CreatedBy = "OrderSeeder", CreatedAt = at });
            History(OrderStatus.Pending, OrderStatus.Pending, orderDate, online || mixed || index % 2 == 0 ? "Thanh toán MoMo" : "Thanh toán COD");
            if (state != OrderStatus.Pending && !online && scenario != 9) History(OrderStatus.Pending, OrderStatus.Confirmed, orderDate.AddHours(1));
            if (state is OrderStatus.Prepared or OrderStatus.Shipping || (!online && state != OrderStatus.Pending && state != OrderStatus.Confirmed && scenario != 9))
                History(OrderStatus.Confirmed, OrderStatus.Prepared, orderDate.AddHours(2));
            if (state == OrderStatus.Shipping || (!online && (state == OrderStatus.Completed || hasReturn || scenario == 16)))
                History(OrderStatus.Prepared, OrderStatus.Shipping, orderDate.AddHours(3));
            if (state == OrderStatus.Completed || hasReturn) History(online ? OrderStatus.Pending : OrderStatus.Shipping, OrderStatus.Completed, completed);
            if (state == OrderStatus.Failed) History(scenario == 9 ? OrderStatus.Pending : OrderStatus.Shipping, OrderStatus.Failed,
                completed, scenario == 9 ? "Khách hủy đơn hàng" : "Không liên lạc được với khách hàng để giao sách.");
            if (hasReturn)
            {
                db.Refunds.Add(new Refund { OrderId = order.Id, Reason = "Sách bị hư hỏng", Description = "Bìa sách bị gập, góc sách bị rách khi mở kiện hàng.",
                    ShippingMethod = "pickup", BankAccount = "Nguyễn Văn An - tài khoản nhận hoàn tiền", ImageUrls = new List<string> { book.CoverImg },
                    CreatedBy = "OrderSeeder", CreatedAt = completed.AddHours(2) });
                History(OrderStatus.Completed, OrderStatus.ReturnRequested, completed.AddHours(2), "Khách gửi yêu cầu hoàn hàng.");
                if (scenario != 10 && scenario != 18) History(OrderStatus.ReturnRequested, OrderStatus.ReturnApproved, completed.AddHours(3), "Đã xác minh sách hư hỏng, đồng ý thu hồi.");
                if (scenario == 12) History(OrderStatus.ReturnApproved, OrderStatus.Returned, completed.AddHours(5), "Đã nhận lại sách và hoàn tiền.");
                if (scenario == 18) History(OrderStatus.ReturnRequested, OrderStatus.Completed, completed.AddHours(4), "Hình ảnh chưa chứng minh sách bị hư hỏng khi giao.");
                if (scenario == 19) History(OrderStatus.ReturnApproved, OrderStatus.Completed, completed.AddHours(6), "Shipper không liên hệ được để nhận lại sách sau các lần hẹn.");
            }
            if (sample.Reviewed)
                db.BookReviews.Add(new BookReview { BookId = book.Id, UserId = user.Id, OrderId = order.Id, Rating = scenario == 10 ? 2 : 4,
                    Content = scenario == 10 ? "Bìa sách bị gập, cần đóng gói cẩn thận hơn." : "Nội dung sách hay, trình bày rõ ràng và dễ đọc.",
                    Status = scenario == 12 ? ReviewStatus.Hidden : ReviewStatus.Approved,
                    IsVerifiedPurchase = true, VerifiedPurchaseType = online ? PurchaseType.Rental : PurchaseType.Physical,
                    IsPointsAwarded = false, CreatedBy = "OrderSeeder", CreatedAt = completed.AddHours(1) });
            // Giữ các đơn trình bày ngoài tiến trình cộng điểm tự động đang có của nhóm.
            db.FPoints.Add(new FPoints { UserId = user.Id, OrderId = order.Id, PointUsed = 0,
                SourceKey = $"Order:{order.Id}:Earn", Description = "Điểm tích lũy đơn hàng", CreatedBy = "OrderSeeder" });
            await db.SaveChangesAsync();
        }
        await tx.CommitAsync();
    }
}
