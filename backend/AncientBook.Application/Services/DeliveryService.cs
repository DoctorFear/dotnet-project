using System.Data;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

public class DeliveryService : IDeliveryService
{
    private readonly IWorkflowDbContext _db;
    private readonly IFPointService _points;
    public DeliveryService(IWorkflowDbContext db, IFPointService points) { _db = db; _points = points; }

    private async Task<int> ResolveShipperAsync(int userId)
    {
        var user = await _db.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsActive || user.Role != UserRole.Shipper)
            throw new UnauthorizedAccessException("Tài khoản Shipper không hợp lệ.");
        var shipper = await _db.Set<Shipper>().AsNoTracking().SingleOrDefaultAsync(s => s.UserId == userId);
        return shipper?.Id ?? throw new UnauthorizedAccessException("Tài khoản chưa được liên kết với hồ sơ Shipper. Liên hệ Admin.");
    }

    public async Task<PagedResult<DeliveryOrderSummaryDto>> GetMyDeliveriesAsync(int shipperUserId, DeliveryOrderQuery query)
    {
        var shipperId = await ResolveShipperAsync(shipperUserId);
        query.PageNumber = Math.Max(1, query.PageNumber); query.PageSize = Math.Clamp(query.PageSize, 1, 100);
        var orders = _db.Set<Order>().AsNoTracking().Where(o => o.ShipperId == shipperId);
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!Enum.TryParse<OrderStatus>(query.Status, true, out var status) ||
                status is not (OrderStatus.Prepared or OrderStatus.Shipping or OrderStatus.Completed or OrderStatus.Failed))
                throw new InvalidOperationException("Trạng thái lọc không hợp lệ.");
            orders = orders.Where(o => o.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim();
            if (keyword.StartsWith("ORD-", StringComparison.OrdinalIgnoreCase)) keyword = keyword[4..];
            orders = orders.Where(o => o.Id.ToString().Contains(keyword) || o.User != null &&
                (o.User.FullName.Contains(keyword) || o.User.PhoneNumber != null && o.User.PhoneNumber.Contains(keyword)));
        }
        var count = await orders.CountAsync();
        var items = await orders.OrderBy(o => o.Status == OrderStatus.Prepared || o.Status == OrderStatus.Shipping ? 0 : 1)
            .ThenByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(o => new DeliveryOrderSummaryDto
            {
                OrderId = o.Id, OrderCode = "ORD-" + o.Id, CustomerName = o.User != null ? o.User.FullName : "N/A",
                ReceiverPhone = o.User != null ? o.User.PhoneNumber : null, ShippingAddress = o.ShippingAddress,
                FinalAmount = o.FinalAmount, CodAmount = o.IsPaid ? 0 : o.FinalAmount, IsPaid = o.IsPaid,
                Status = o.Status.ToString(), OrderDate = o.OrderDate
            }).ToListAsync();
        return new(items, count, query.PageNumber, query.PageSize);
    }

    public async Task<DeliveryOrderDetailDto> GetDeliveryDetailAsync(int orderId, int shipperUserId)
    {
        var shipperId = await ResolveShipperAsync(shipperUserId);
        var order = await _db.Set<Order>().AsNoTracking().Include(o => o.User).Include(o => o.Shipper)
            .Include(o => o.OrderItems).ThenInclude(i => i.Book).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        if (order.ShipperId != shipperId) throw new UnauthorizedAccessException("Bạn không có quyền xem đơn hàng này.");
        var failure = await _db.Set<OrderFailureReason>().AsNoTracking().Where(f => f.OrderId == orderId)
            .OrderByDescending(f => f.RecordedAt)
            .Select(f => new { Reason = f.FailureReason!.ReasonText, f.FailureNote }).FirstOrDefaultAsync();
        var isReadOnly = order.Status is OrderStatus.Completed or OrderStatus.Failed;
        var completedAt = isReadOnly
            ? await _db.Set<OrderStatusHistory>().AsNoTracking()
                .Where(h => h.OrderId == orderId && h.ToStatus == order.Status)
                .OrderByDescending(h => h.ChangedAt).Select(h => (DateTime?)h.ChangedAt).FirstOrDefaultAsync()
            : null;
        return new DeliveryOrderDetailDto
        {
            OrderId = order.Id, OrderCode = "ORD-" + order.Id, CustomerName = order.User?.FullName ?? "N/A",
            ReceiverPhone = order.User?.PhoneNumber, ShippingAddress = order.ShippingAddress,
            OrderDate = order.OrderDate, Status = order.Status.ToString(), IsPaid = order.IsPaid,
            FinalAmount = order.FinalAmount, CodAmount = order.IsPaid ? 0 : order.FinalAmount,
            Note = failure?.Reason,
            IsReadOnly = isReadOnly, CompletedAt = completedAt,
            FailureReason = failure?.Reason, FailureNote = failure?.FailureNote,
            Items = order.OrderItems.Where(i => i.PurchaseType == PurchaseType.Physical).Select(i => new DeliveryItemDto
            { BookId = i.BookId, BookTitle = i.Book?.Title ?? "N/A", Quantity = i.Quantity, UnitPrice = i.UnitPrice }).ToList()
        };
    }

    public async Task<bool> UpdateDeliveryStatusAsync(int orderId, int shipperUserId, UpdateDeliveryStatusRequest request)
    {
        var shipperId = await ResolveShipperAsync(shipperUserId);
        if (!Enum.TryParse<OrderStatus>(request.NewStatus, true, out var next) || !Enum.IsDefined(next))
            throw new InvalidOperationException("Trạng thái không hợp lệ.");
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        if (order.ShipperId != shipperId) throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn này.");
        var previous = order.Status;
        if (!((previous == OrderStatus.Prepared && next == OrderStatus.Shipping) ||
            (previous == OrderStatus.Shipping && next is OrderStatus.Completed or OrderStatus.Failed)))
            throw new InvalidOperationException($"Không thể chuyển từ {previous} sang {next}.");
        if (!order.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical))
            throw new InvalidOperationException("Shipper chỉ xử lý đơn sách vật lý.");
        var actor = "Shipper-" + shipperUserId;
        string? note = null;
        if (next == OrderStatus.Failed)
        {
            var reason = await _db.Set<FailureReason>().AsNoTracking().FirstOrDefaultAsync(f =>
                f.Id == request.FailureReasonId && f.IsActive)
                ?? throw new InvalidOperationException("Vui lòng chọn lý do giao thất bại hợp lệ.");
            if (request.FailureNote?.Length > 500) throw new InvalidOperationException("Ghi chú tối đa 500 ký tự.");
            note = reason.ReasonText;
            _db.Set<OrderFailureReason>().Add(new OrderFailureReason
            {
                OrderId = orderId, FailureReasonId = reason.Id, FailureNote = request.FailureNote,
                RecordedBy = actor, RecordedAt = TimeZoneHelper.GetVietnamTime(), CreatedBy = actor
            });
            foreach (var group in order.OrderItems.Where(i => i.PurchaseType == PurchaseType.Physical)
                .GroupBy(i => i.BookId).OrderBy(g => g.Key))
            {
                await WorkflowSupport.LockBookAsync(_db, group.Key);
                var book = await _db.Set<Book>().FirstAsync(b => b.Id == group.Key);
                var inventory = await _db.Set<Inventory>().FirstOrDefaultAsync(i => i.BookId == group.Key)
                    ?? throw new InvalidOperationException("Không tìm thấy tồn kho để hoàn sách.");
                var before = inventory.QuantityOnHand;
                var quantity = group.Sum(i => i.Quantity);
                inventory.QuantityOnHand = checked(before + quantity);
                inventory.UpdatedBy = actor; inventory.LastUpdated = TimeZoneHelper.GetVietnamTime();
                book.StockCount = checked(book.StockCount + quantity);
                book.StockStatus = book.StockCount > 0 ? StockStatus.InStock : StockStatus.OutOfStock;
                WorkflowSupport.Audit(_db, "DeliveryStockRestored", "Inventory", inventory.Id,
                    new { QuantityOnHand = before }, new { inventory.QuantityOnHand }, shipperUserId,
                    $"Đơn #{orderId}; lý do: {note}; hoàn {quantity} cuốn.");
            }
            WorkflowSupport.Notify(_db, $"Đơn #{orderId} giao thất bại: {note}. Đã hoàn kho, kho và vận chuyển cần nhận lại kiện hàng.", orderId);
        }
        order.Status = next; order.UpdatedBy = actor;
        if (next == OrderStatus.Completed) order.IsPaid = true;
        WorkflowSupport.StatusHistory(_db, order, previous, actor, note);
        WorkflowSupport.Audit(_db, "DeliveryStatusUpdated", "Order", orderId,
            new { Status = previous }, new { order.Status, order.IsPaid }, shipperUserId, note);
        await _db.SaveChangesAsync();
        if (next == OrderStatus.Completed)
        {
            await _points.AwardCompletedOrderAsync(orderId);
            // API E-Book tặng xác thực quyền đọc theo đơn sách vật lý đã hoàn thành và thanh toán.
            WorkflowSupport.Notify(_db, $"Đơn #{orderId} đã giao thành công. Điểm và quyền đọc E-Book tặng kèm (nếu có) đã kích hoạt.", orderId, order.UserId);
            await _db.SaveChangesAsync();
        }
        await tx.CommitAsync();
        return true;
    }

    public Task<List<FailureReasonDto>> GetFailureReasonsAsync() => _db.Set<FailureReason>().AsNoTracking()
        .Where(f => f.IsActive).OrderBy(f => f.DisplayOrder).ThenBy(f => f.Id)
        .Select(f => new FailureReasonDto { Id = f.Id, ReasonText = f.ReasonText,
            Description = f.Description, DisplayOrder = f.DisplayOrder }).ToListAsync();

    public async Task LinkShipperAccountAsync(int shipperId, int userId, int actorId)
    {
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        var user = await _db.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId && u.IsActive && u.Role == UserRole.Shipper)
            ?? throw new InvalidOperationException("Phải chọn tài khoản Shipper đang hoạt động.");
        var shipper = await _db.Set<Shipper>().FirstOrDefaultAsync(s => s.Id == shipperId)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ Shipper.");
        if (await _db.Set<Shipper>().AnyAsync(s => s.UserId == userId && s.Id != shipperId))
            throw new InvalidOperationException("Tài khoản đã được liên kết với Shipper khác.");
        var previous = shipper.UserId;
        shipper.UserId = user.Id;
        WorkflowSupport.Audit(_db, "ShipperAccountLinked", "Shipper", shipperId,
            new { UserId = previous }, new { shipper.UserId }, actorId);
        await _db.SaveChangesAsync(); await tx.CommitAsync();
    }
}
