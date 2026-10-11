using System.Data;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

public class FulfillmentService : IFulfillmentService
{
    private readonly IWorkflowDbContext _db;
    public FulfillmentService(IWorkflowDbContext db) => _db = db;

    public async Task<PagedResult<FulfillmentPendingItem>> GetPendingOrdersAsync(FulfillmentPendingQuery query)
    {
        query.PageNumber = Math.Max(1, query.PageNumber);
        query.PageSize = Math.Clamp(query.PageSize, 1, 100);
        var orders = _db.Set<Order>().AsNoTracking().Where(o => o.Status == OrderStatus.Confirmed
            && o.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical));
        if (query.FromDate > query.ToDate) throw new InvalidOperationException("Khoảng ngày không hợp lệ.");
        if (query.FromDate.HasValue) orders = orders.Where(o => o.OrderDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) orders = orders.Where(o => o.OrderDate <= query.ToDate.Value);
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim();
            orders = orders.Where(o => o.Id.ToString().Contains(keyword) || o.User != null && o.User.FullName.Contains(keyword));
        }
        var count = await orders.CountAsync();
        var items = await orders.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(o => new FulfillmentPendingItem
            {
                OrderId = o.Id, CustomerName = o.User != null ? o.User.FullName : "N/A",
                OrderDate = o.OrderDate, FinalAmount = o.FinalAmount, Status = o.Status,
                TotalItems = o.OrderItems.Where(i => i.PurchaseType == PurchaseType.Physical).Sum(i => i.Quantity),
                PackingIssue = o.PackingIssue
            }).ToListAsync();
        return new(items, count, query.PageNumber, query.PageSize);
    }

    public async Task<FulfillmentDetailResponse> GetOrderDetailAsync(int orderId)
    {
        var order = await _db.Set<Order>().AsNoTracking().Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(i => i.Book).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        ValidatePacking(order);
        return new FulfillmentDetailResponse
        {
            OrderId = order.Id, CustomerName = order.User?.FullName ?? "N/A",
            ReceiverPhone = order.User?.PhoneNumber, ShippingAddress = order.ShippingAddress,
            PackingIssue = order.PackingIssue,
            Items = order.OrderItems.Where(i => i.PurchaseType == PurchaseType.Physical).Select(i => new FulfillmentItemDetail
            {
                BookId = i.BookId, BookTitle = i.Book?.Title ?? "N/A", BookCover = i.Book?.CoverImg,
                Quantity = i.Quantity, UnitPrice = i.UnitPrice
            }).ToList()
        };
    }

    public async Task<bool> ConfirmPackingAsync(int orderId, string staffUsername)
    {
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        ValidatePacking(order);
        var previous = order.Status;
        order.Status = OrderStatus.Prepared;
        order.PackingIssue = null;
        order.UpdatedBy = staffUsername;
        WorkflowSupport.StatusHistory(_db, order, previous, staffUsername);
        WorkflowSupport.Audit(_db, "PackingCompleted", "Order", orderId, new { Status = previous },
            new { order.Status }, await ActorIdAsync(staffUsername));
        WorkflowSupport.Notify(_db, $"Đơn #{orderId} đã đóng gói xong, chờ phân công Shipper.", orderId);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    public async Task<bool> ReportPackingIssueAsync(int orderId, string staffUsername, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000)
            throw new InvalidOperationException("Vui lòng nhập lý do sự cố kho (tối đa 1.000 ký tự).");
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        ValidatePacking(order);
        var old = order.PackingIssue;
        order.PackingIssue = reason.Trim();
        order.UpdatedBy = staffUsername;
        WorkflowSupport.Audit(_db, "PackingIssue", "Order", orderId, new { PackingIssue = old },
            new { order.PackingIssue }, await ActorIdAsync(staffUsername));
        var message = $"Sự cố kho đơn #{orderId}: {order.PackingIssue}";
        WorkflowSupport.Notify(_db, message[..Math.Min(1000, message.Length)], orderId);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    private Task<int?> ActorIdAsync(string username) => _db.Set<User>()
        .Where(u => u.Username == username).Select(u => (int?)u.Id).FirstOrDefaultAsync();

    private static void ValidatePacking(Order order)
    {
        if (order.Status != OrderStatus.Confirmed)
            throw new InvalidOperationException("Đơn đã bị hủy hoặc được nhân viên khác xử lý. Vui lòng làm mới danh sách.");
        if (!order.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical))
            throw new InvalidOperationException("Chỉ đóng gói đơn có sách vật lý.");
    }
}
