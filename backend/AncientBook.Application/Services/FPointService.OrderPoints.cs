using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

public partial class FPointService
{
    private async Task<DateTime> GetReturnDeadlineAsync(Order order)
    {
        var completedAt = await _db.Set<OrderStatusHistory>().AsNoTracking()
            .Where(h => h.OrderId == order.Id && h.ToStatus == OrderStatus.Completed)
            .OrderBy(h => h.ChangedAt).Select(h => (DateTime?)h.ChangedAt).FirstOrDefaultAsync()
            ?? order.UpdatedAt ?? TimeZoneHelper.GetVietnamTime();
        var days = await WorkflowSupport.IntSettingAsync(_db, "MAX_RETURN_DAYS", 3);
        return completedAt.AddDays(days);
    }

    public async Task<OrderPointsDto> GetOrderPointsAsync(int userId, int orderId)
    {
        var order = await _db.Set<Order>().AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        if (order.UserId != userId) throw new UnauthorizedAccessException("Đơn hàng không thuộc về bạn.");
        var earn = await _db.Set<FPoints>().AsNoTracking()
            .FirstOrDefaultAsync(p => p.SourceKey == $"Order:{orderId}:Earn");
        var physical = await _db.Set<OrderItem>().AnyAsync(i => i.OrderId == orderId && i.PurchaseType == PurchaseType.Physical);
        return new OrderPointsDto
        {
            OrderId = orderId, ReceiptConfirmedAt = order.ReceiptConfirmedAt,
            PendingPoints = earn?.Status == PointStatus.Pending ? -earn.PointUsed : 0,
            AvailablePoints = earn?.Status == PointStatus.Available ? -earn.PointUsed : 0,
            CancelledPoints = earn?.Status == PointStatus.Cancelled ? -earn.PointUsed : 0,
            AvailableAt = earn?.AvailableAt,
            CanConfirmReceipt = physical && order.Status == OrderStatus.Completed && order.IsPaid
                && !order.ReceiptConfirmedAt.HasValue
                && !await _db.Set<Refund>().AnyAsync(r => r.OrderId == orderId)
        };
    }

    public async Task<OrderPointsDto> ConfirmReceiptAsync(int userId, int orderId, bool acceptCloseReturnWindow)
    {
        if (!acceptCloseReturnWindow)
            throw new InvalidOperationException("Bạn cần đồng ý kết thúc quyền đổi trả/hoàn tiền khi xác nhận nhận hàng.");
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        if (order.UserId != userId) throw new UnauthorizedAccessException("Đơn hàng không thuộc về bạn.");
        if (order.Status != OrderStatus.Completed || !order.IsPaid
            || !await _db.Set<OrderItem>().AnyAsync(i => i.OrderId == orderId && i.PurchaseType == PurchaseType.Physical))
            throw new InvalidOperationException("Chỉ xác nhận nhận hàng cho đơn sách giấy đã giao thành công và thanh toán.");
        if (await _db.Set<Refund>().AnyAsync(r => r.OrderId == orderId))
            throw new InvalidOperationException("Đơn đã gửi yêu cầu hoàn trả, không thể xác nhận kết thúc quyền đổi trả.");
        if (!order.ReceiptConfirmedAt.HasValue)
        {
            order.ReceiptConfirmedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = userId.ToString();
            WorkflowSupport.Audit(_db, "ReceiptConfirmed", "Order", orderId, new { ReceiptConfirmedAt = (DateTime?)null },
                new { order.ReceiptConfirmedAt }, userId, "Khách đồng ý kết thúc quyền đổi trả/hoàn tiền.");
            await _db.SaveChangesAsync();
        }
        await AwardCompletedOrderAsync(orderId);
        await ReconcileOrderPointsAsync(orderId);
        await tx.CommitAsync();
        return await GetOrderPointsAsync(userId, orderId);
    }

    public async Task ValidateReturnEligibilityAsync(int orderId)
    {
        var order = await _db.Set<Order>().AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        if (order.ReceiptConfirmedAt.HasValue)
            throw new InvalidOperationException("Bạn đã xác nhận nhận hàng và kết thúc quyền đổi trả/hoàn tiền của đơn này.");
        var earn = await _db.Set<FPoints>().AsNoTracking()
            .FirstOrDefaultAsync(p => p.SourceKey == $"Order:{orderId}:Earn");
        var deadline = earn?.AvailableAt ?? await GetReturnDeadlineAsync(order);
        if (TimeZoneHelper.GetVietnamTime() >= deadline)
            throw new InvalidOperationException("Đơn hàng đã hết thời hạn hoàn trả.");
    }

    public async Task ReconcileOrderPointsAsync(int orderId)
    {
        await using var tx = _db.Database.CurrentTransaction == null
            ? await _db.BeginWorkflowTransactionAsync() : null;
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        var earn = await _db.Set<FPoints>().FirstOrDefaultAsync(p => p.SourceKey == $"Order:{orderId}:Earn");
        if (earn?.Status == PointStatus.Cancelled && order.Status == OrderStatus.Completed && order.IsPaid
            && await _db.Set<OrderStatusHistory>().AnyAsync(h => h.OrderId == orderId
                && (h.FromStatus == OrderStatus.ReturnRequested || h.FromStatus == OrderStatus.ReturnApproved)
                && h.ToStatus == OrderStatus.Completed))
        {
            earn.Status = PointStatus.Pending;
            WorkflowSupport.Audit(_db, "OrderPointsRestored", "FPoints", earn.Id,
                new { Status = PointStatus.Cancelled.ToString() }, new { Status = PointStatus.Pending.ToString() },
                details: $"Đơn #{orderId} không hoàn trả; giữ hạn đổi trả ban đầu.");
            await _db.SaveChangesAsync();
        }
        if (earn?.Status == PointStatus.Pending)
        {
            var cancel = order.Status is OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.Returned or OrderStatus.Failed;
            var release = order.Status == OrderStatus.Completed && order.IsPaid
                && (order.ReceiptConfirmedAt.HasValue || earn.AvailableAt <= TimeZoneHelper.GetVietnamTime());
            if (cancel || release)
            {
                await WorkflowSupport.LockUserAsync(_db, order.UserId);
                var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
                var before = user.FPoints;
                earn.Status = cancel ? PointStatus.Cancelled : PointStatus.Available;
                earn.UpdatedBy = "System";
                if (release) user.FPoints = checked(user.FPoints - earn.PointUsed);
                WorkflowSupport.Audit(_db, cancel ? "OrderPointsCancelled" : "OrderPointsReleased", "FPoints", earn.Id,
                    new { Status = PointStatus.Pending.ToString(), FPoints = before },
                    new { Status = earn.Status.ToString(), user.FPoints }, details: $"Đơn #{orderId}: {-earn.PointUsed} điểm.");
                if (release) WorkflowSupport.Notify(_db, $"{-earn.PointUsed} F-Point từ đơn #{orderId} đã khả dụng.", orderId, order.UserId);
                await _db.SaveChangesAsync();
            }
        }
        if (tx != null) await tx.CommitAsync();
    }
}
