using System.Data;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence;

public static class InventorySeeder
{
    private const string SeedPrefix = "SEED-WH-V1-";

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await using var transaction = context.Database.CurrentTransaction == null
            ? await context.Database.BeginTransactionAsync(IsolationLevel.Serializable) : null;

        // Không nhập lặp và không ghi đè kho đã có chứng từ hoặc giao dịch thực tế.
        if (await context.PurchaseOrders.AnyAsync() || await context.StockMovements.AnyAsync() || await context.OrderItems.AnyAsync()) return;
        var books = await context.Books.Where(book => book.IsPhysicalAvailable).OrderBy(book => book.Id).ToListAsync();
        var staffId = await context.Users.Where(user => user.Role == UserRole.Staff && user.IsActive)
            .OrderBy(user => user.Id).Select(user => (int?)user.Id).FirstOrDefaultAsync();
        if (books.Count < 3 || staffId == null || books.Count(book => !book.PublisherId.HasValue) > 2) return;

        var actor = staffId.Value.ToString();
        var now = TimeZoneHelper.GetVietnamTime();
        var publishers = await context.Publishers.ToDictionaryAsync(publisher => publisher.Id);
        var inventories = await context.Inventories.ToDictionaryAsync(inventory => inventory.BookId);
        var suppliers = await context.Suppliers.Where(supplier => supplier.Status == "Active").ToListAsync();

        // Dành hai đầu sách chưa nhập; sách thiếu NXB không được gán tùy ý sang NXB khác.
        var unreceived = books.Where(book => !book.PublisherId.HasValue)
            .Concat(books.OrderByDescending(book => book.Id)).Select(book => book.Id).Distinct().Take(2).ToHashSet();

        foreach (var book in books)
        {
            // Tồn mẫu cũ chưa có chứng từ được thay bằng tồn đầu kỳ 0 trước khi nhập.
            book.StockCount = 0;
            book.StockStatus = StockStatus.OutOfStock;
            book.UpdatedBy = actor;
            if (!inventories.TryGetValue(book.Id, out var inventory))
            {
                inventory = new Inventory { BookId = book.Id, ReorderLevel = 5, CreatedBy = actor };
                context.Inventories.Add(inventory);
                inventories.Add(book.Id, inventory);
            }
            inventory.QuantityOnHand = 0;
            inventory.LastUpdated = now;
            inventory.UpdatedBy = actor;
        }

        var incoming = books.Where(book => !unreceived.Contains(book.Id)).Select((book, index) => new
        {
            Book = book,
            Quantity = index < 5 ? index + 1 : 8 + (index - 5) * 7,
            Split = index % 4 == 0 && index >= 5
        }).ToList();
        var orderNumber = 0;
        var receipts = new List<(PurchaseOrder Order, DateTime ReceivedAt)>();
        var movements = new List<(StockMovement Movement, DateTime ReceivedAt)>();
        var firstReceipts = new Dictionary<int, DateTime>();
        foreach (var group in incoming.GroupBy(item => item.Book.PublisherId!.Value))
        {
            var publisher = publishers[group.Key];
            var supplier = suppliers.FirstOrDefault(item => item.Name == publisher.Name);
            if (supplier == null)
            {
                supplier = new Supplier
                {
                    Name = publisher.Name, Address = "Kho phát hành " + publisher.Name,
                    ContactPerson = "Bộ phận phát hành", Status = "Active", CreatedBy = actor
                };
                context.Suppliers.Add(supplier);
                suppliers.Add(supplier);
            }

            // Phiếu đầu gộp tối đa hai sách cùng NXB; các sách còn lại nhập riêng.
            var entries = group.ToList();
            var batches = new List<List<(Book Book, int Quantity)>>();
            batches.Add(entries.Take(2).Select(item => (item.Book, item.Split ? item.Quantity / 2 : item.Quantity)).ToList());
            batches.AddRange(entries.Skip(2).Select(item => new List<(Book, int)> { (item.Book, item.Split ? item.Quantity / 2 : item.Quantity) }));
            batches.AddRange(entries.Where(item => item.Split).Select(item => new List<(Book, int)> { (item.Book, item.Quantity - item.Quantity / 2) }));

            foreach (var batch in batches)
            {
                orderNumber++;
                var code = $"{SeedPrefix}{orderNumber:000}";
                var receivedAt = now.Date.AddDays(-books.Count * 2 + orderNumber).AddHours(10);
                var order = new PurchaseOrder
                {
                    Code = code, Supplier = supplier, Status = "Received", CreatedBy = actor,
                    ApprovedBy = actor, ApprovedAt = receivedAt.AddDays(-1), UpdatedBy = actor,
                    Notes = $"Dữ liệu nhập kho mẫu; NXB: {publisher.Name}; nhận đủ ngày {receivedAt:dd/MM/yyyy}."
                };
                foreach (var (book, quantity) in batch)
                {
                    var cost = decimal.Round(book.PhysicalPrice * 0.65m, 0, MidpointRounding.AwayFromZero);
                    order.Items.Add(new PurchaseOrderItem
                    {
                        BookId = book.Id, OrderedQuantity = quantity, ReceivedQuantity = quantity,
                        UnitPrice = cost, CreatedBy = actor
                    });
                    order.TotalAmount += cost * quantity;
                    var inventory = inventories[book.Id];
                    var before = inventory.QuantityOnHand;
                    inventory.QuantityOnHand += quantity;
                    inventory.LastUpdated = receivedAt;
                    book.StockCount = inventory.QuantityOnHand;
                    book.StockStatus = book.StockCount <= inventory.ReorderLevel ? StockStatus.LowStock : StockStatus.InStock;
                    var movement = new StockMovement
                    {
                        BookId = book.Id, MovementType = "Import", QuantityChange = quantity,
                        StockBefore = before, StockAfter = inventory.QuantityOnHand,
                        Reason = $"Nhập đủ phiếu {code}; ngày {receivedAt:dd/MM/yyyy}.", CreatedBy = actor
                    };
                    context.StockMovements.Add(movement);
                    movements.Add((movement, receivedAt));
                    firstReceipts.TryAdd(book.Id, receivedAt);
                }
                context.PurchaseOrders.Add(order);
                receipts.Add((order, receivedAt));
            }
        }
        await context.SaveChangesAsync();

        // SaveChanges gán thời gian hiện tại; đặt lại mốc lịch sử chỉ cho dữ liệu mẫu vừa tạo.
        foreach (var (order, receivedAt) in receipts)
        {
            var createdAt = receivedAt.AddDays(-2);
            await context.PurchaseOrders.Where(item => item.Id == order.Id).ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.CreatedAt, createdAt).SetProperty(item => item.UpdatedAt, receivedAt));
            await context.PurchaseOrderItems.Where(item => item.PurchaseOrderId == order.Id).ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.CreatedAt, createdAt).SetProperty(item => item.UpdatedAt, receivedAt));
        }
        foreach (var (movement, receivedAt) in movements)
            await context.StockMovements.Where(item => item.Id == movement.Id).ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.CreatedAt, receivedAt));
        foreach (var (bookId, receivedAt) in firstReceipts)
        {
            var lastUpdated = inventories[bookId].LastUpdated;
            await context.Inventories.Where(item => item.BookId == bookId).ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.CreatedAt, receivedAt).SetProperty(item => item.UpdatedAt, lastUpdated));
        }
        if (transaction != null) await transaction.CommitAsync();
    }
}
