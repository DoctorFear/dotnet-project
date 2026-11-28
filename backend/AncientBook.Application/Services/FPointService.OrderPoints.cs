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

    // public async Task ReconcileOrderPointsAsync(int orderId)
    // {
    //     await using var tx = _db.Database.CurrentTransaction == null
    //         ? await _db.BeginWorkflowTransactionAsync() : null;
    //     await WorkflowSupport.LockOrderAsync(_db, orderId);
    //     var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
    //         ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
    //     var earn = await _db.Set<FPoints>().FirstOrDefaultAsync(p => p.SourceKey == $"Order:{orderId}:Earn");
    //     if (earn?.Status == PointStatus.Cancelled && order.Status == OrderStatus.Completed && order.IsPaid
    //         && await _db.Set<OrderStatusHistory>().AnyAsync(h => h.OrderId == orderId
    //             && (h.FromStatus == OrderStatus.ReturnRequested || h.FromStatus == OrderStatus.ReturnApproved)
    //             && h.ToStatus == OrderStatus.Completed))
    //     {
    //         earn.Status = PointStatus.Pending;
    //         WorkflowSupport.Audit(_db, "OrderPointsRestored", "FPoints", earn.Id,
    //             new { Status = PointStatus.Cancelled.ToString() }, new { Status = PointStatus.Pending.ToString() },
    //             details: $"Đơn #{orderId} không hoàn trả; giữ hạn đổi trả ban đầu.");
    //         await _db.SaveChangesAsync();
    //     }
    //     if (earn?.Status == PointStatus.Pending)
    //     {
    //         var cancel = order.Status is OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.Returned or OrderStatus.Failed;
    //         var release = order.Status == OrderStatus.Completed && order.IsPaid
    //             && (order.ReceiptConfirmedAt.HasValue || earn.AvailableAt <= TimeZoneHelper.GetVietnamTime());
    //         if (cancel || release)
    //         {
    //             await WorkflowSupport.LockUserAsync(_db, order.UserId);
    //             var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
    //             var before = user.FPoints;
    //             earn.Status = cancel ? PointStatus.Cancelled : PointStatus.Available;
    //             earn.UpdatedBy = "System";
    //             if (release) user.FPoints = checked(user.FPoints - earn.PointUsed);
    //             WorkflowSupport.Audit(_db, cancel ? "OrderPointsCancelled" : "OrderPointsReleased", "FPoints", earn.Id,
    //                 new { Status = PointStatus.Pending.ToString(), FPoints = before },
    //                 new { Status = earn.Status.ToString(), user.FPoints }, details: $"Đơn #{orderId}: {-earn.PointUsed} điểm.");
    //             if (release) WorkflowSupport.Notify(_db, $"{-earn.PointUsed} F-Point từ đơn #{orderId} đã khả dụng.", orderId, order.UserId);
    //             await _db.SaveChangesAsync();
    //         }
    //     }
    //     if (tx != null) await tx.CommitAsync();
    // }
    public async Task ReconcileOrderPointsAsync(int orderId)
    {
        await using var tx = _db.Database.CurrentTransaction == null
            ? await _db.BeginWorkflowTransactionAsync() : null;
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

        bool usedFPoints = order.DiscountAmount > 0 || order.PointsId != null;

        var redeem = await _db.Set<FPoints>().FirstOrDefaultAsync(p =>
            p.SourceKey == $"Order:{orderId}:Redeem" && p.PointUsed > 0);
        var refundRedeem = order.Status is OrderStatus.Failed or OrderStatus.Returned;
        if (refundRedeem && redeem != null)
        {
            var actor = order.UpdatedBy ?? "System";
            var actorMatch = System.Text.RegularExpressions.Regex.Match(actor, @"([0-9]+)$");
            var actorUserId = actorMatch.Success && int.TryParse(actorMatch.Value, out var parsedActorId)
                ? parsedActorId : (int?)null;
            var refundKey = $"Order:{orderId}:RedeemRefund";
            var refundExists = await _db.Set<FPoints>().AnyAsync(p => p.SourceKey == refundKey);
            if (redeem.Status != PointStatus.Cancelled)
            {
                await WorkflowSupport.LockUserAsync(_db, order.UserId);
                var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
                var before = user.FPoints;
                var previousPointStatus = redeem.Status;
                user.FPoints = checked(user.FPoints + redeem.PointUsed);
                redeem.Status = PointStatus.Cancelled;
                redeem.Description = $"Sử dụng {redeem.PointUsed} F-Point đơn #{orderId} (đã hoàn)";
                redeem.UpdatedBy = actor;
                if (!refundExists)
                    _db.Set<FPoints>().Add(new FPoints
                    {
                        UserId = order.UserId, OrderId = orderId, PointUsed = -redeem.PointUsed,
                        SourceKey = refundKey, Description = $"Hoàn {redeem.PointUsed} F-Point của đơn #{orderId}",
                        Status = PointStatus.Available, AvailableAt = TimeZoneHelper.GetVietnamTime(), CreatedBy = actor
                    });
                WorkflowSupport.Audit(_db, "RedeemedPointsRefunded", "FPoints", redeem.Id,
                    new { Status = previousPointStatus.ToString(), FPoints = before },
                    new { Status = redeem.Status.ToString(), user.FPoints,
                        RefundedPoints = redeem.PointUsed, RefundedValue = redeem.PointUsed * 100m }, actorUserId,
                    $"Đơn #{orderId}: hoàn {redeem.PointUsed} F-Point ({redeem.PointUsed * 100m:N0} đ) do đơn {order.Status}.");
                WorkflowSupport.Notify(_db, $"Đã hoàn {redeem.PointUsed} F-Point của đơn #{orderId} vào ví.",
                    orderId, order.UserId);
                await _db.SaveChangesAsync();
            }
            else if (!refundExists)
            {
                _db.Set<FPoints>().Add(new FPoints
                {
                    UserId = order.UserId, OrderId = orderId, PointUsed = -redeem.PointUsed,
                    SourceKey = refundKey, Description = $"Hoàn {redeem.PointUsed} F-Point của đơn #{orderId}",
                    Status = PointStatus.Available, AvailableAt = TimeZoneHelper.GetVietnamTime(), CreatedBy = "System"
                });
                WorkflowSupport.Audit(_db, "RedeemRefundLedgerBackfilled", "FPoints", redeem.Id,
                    null, new { SourceKey = refundKey, RefundedPoints = redeem.PointUsed }, actorUserId,
                    $"Bổ sung dòng lịch sử hoàn điểm đã thực hiện cho đơn #{orderId}; không thay đổi số dư.");
                await _db.SaveChangesAsync();
            }
        }

        var earn = await _db.Set<FPoints>().FirstOrDefaultAsync(p => p.SourceKey == $"Order:{orderId}:Earn");
        if (!usedFPoints
            && earn?.Status == PointStatus.Cancelled
            && order.Status == OrderStatus.Completed
            && order.IsPaid
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
        if (earn?.Status == PointStatus.Available && order.Status == OrderStatus.Returned)
        {
            await WorkflowSupport.LockUserAsync(_db, order.UserId);
            var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
            var before = user.FPoints;
            var earnedPoints = -earn.PointUsed;
            user.FPoints = checked(user.FPoints - earnedPoints);
            earn.Status = PointStatus.Cancelled;
            var actor = order.UpdatedBy ?? "System";
            earn.UpdatedBy = actor;
            var revokeKey = $"Order:{orderId}:EarnRevoke";
            if (!await _db.Set<FPoints>().AnyAsync(p => p.SourceKey == revokeKey))
                _db.Set<FPoints>().Add(new FPoints
                {
                    UserId = order.UserId, OrderId = orderId, PointUsed = earnedPoints,
                    SourceKey = revokeKey, Description = $"Thu hồi {earnedPoints} F-Point do hoàn trả đơn #{orderId}",
                    Status = PointStatus.Available, AvailableAt = TimeZoneHelper.GetVietnamTime(), CreatedBy = actor
                });
            var actorMatch = System.Text.RegularExpressions.Regex.Match(actor, @"([0-9]+)$");
            var actorUserId = actorMatch.Success && int.TryParse(actorMatch.Value, out var parsedActorId)
                ? parsedActorId : (int?)null;
            WorkflowSupport.Audit(_db, "OrderPointsRevoked", "FPoints", earn.Id,
                new { Status = PointStatus.Available.ToString(), FPoints = before },
                new { Status = earn.Status.ToString(), user.FPoints, RevokedPoints = earnedPoints },
                actorUserId, $"Đơn #{orderId} hoàn trả: thu hồi {earnedPoints} F-Point đã tích.");
            WorkflowSupport.Notify(_db,
                $"Đã thu hồi {earnedPoints} F-Point đã tích của đơn #{orderId} do hoàn trả thành công.",
                orderId, order.UserId);
            await _db.SaveChangesAsync();
        }
        if (earn?.Status == PointStatus.Pending)
        {
            var cancel = usedFPoints
                || order.Status is OrderStatus.ReturnRequested or OrderStatus.ReturnApproved or OrderStatus.Returned or OrderStatus.Failed;
            var release = !usedFPoints
                && order.Status == OrderStatus.Completed
                && order.IsPaid
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
                    new { Status = earn.Status.ToString(), user.FPoints },
                    details: usedFPoints
                        ? $"Đơn #{orderId}: hủy tích điểm do đơn hàng có sử dụng F-Point."
                        : $"Đơn #{orderId}: {-earn.PointUsed} điểm.");
                if (release) WorkflowSupport.Notify(_db, $"{-earn.PointUsed} F-Point từ đơn #{orderId} đã khả dụng.", orderId, order.UserId);
                await _db.SaveChangesAsync();
            }
        }
        if (tx != null) await tx.CommitAsync();
    }
}
