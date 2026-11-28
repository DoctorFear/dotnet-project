using System.Data;
using System.Globalization;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AncientBook.Application.Services;

public partial class FPointService : IFPointService
{
    private readonly IWorkflowDbContext _db;
    private readonly IMemoryCache _cache;
    private const string TierCacheKey = "MembershipTiers_All";
    public FPointService(IWorkflowDbContext db, IMemoryCache cache) { _db = db; _cache = cache; }

    public async Task<FPointBalanceDto> GetBalanceAsync(int userId)
    {
        var user = await _db.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản.");
        var tiers = await GetMembershipTiersAsync();
        var tier = tiers.FirstOrDefault(t => t.Id == user.MembershipTierId) ?? tiers.FirstOrDefault();
        var pending = await _db.Set<FPoints>().Where(p => p.UserId == userId && p.Status == PointStatus.Pending)
            .SumAsync(p => (int?)-p.PointUsed) ?? 0;
        var earned = await _db.Set<FPoints>().Where(p => p.UserId == userId && p.PointUsed < 0
            && p.Status == PointStatus.Available
            && (p.SourceKey == null || !p.SourceKey.EndsWith(":RedeemRefund")))
            .SumAsync(p => (int?)-p.PointUsed) ?? 0;
        return new FPointBalanceDto { UserId = user.Id, CurrentPoints = user.FPoints,
            PendingPoints = pending, TotalPointsEarned = earned, TotalSpent = user.TotalSpent,
            TierName = tier?.TierName ?? "Đồng", PointRate = tier?.PointRate ?? 5 };
    }

    public async Task<FPointHistoryResultDto> GetHistoryAsync(int userId, FPointHistoryQuery query)
    {
        query.PageNumber = Math.Max(1, query.PageNumber);
        query.PageSize = Math.Clamp(query.PageSize, 1, 100);
        if (query.FromDate.HasValue && query.ToDate.HasValue
            && query.FromDate.Value.Date > query.ToDate.Value.Date)
            throw new InvalidOperationException("Khoảng ngày lịch sử F-Point không hợp lệ.");

        var user = await _db.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản.");
        var records = await _db.Set<FPoints>().AsNoTracking()
            .Where(p => p.UserId == userId && p.PointUsed != 0).ToListAsync();
        var sourceKeys = records.Where(record => record.SourceKey != null)
            .Select(record => record.SourceKey!).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var refundedAtByOrder = records
            .Where(record => record.OrderId.HasValue && record.UpdatedAt.HasValue
                && record.SourceKey?.EndsWith(":Redeem", StringComparison.OrdinalIgnoreCase) == true)
            .GroupBy(record => record.OrderId!.Value)
            .ToDictionary(group => group.Key, group => group.Max(record => record.UpdatedAt!.Value));
        DateTime EffectiveCreatedAt(FPoints record) =>
            record.OrderId.HasValue
            && record.SourceKey?.EndsWith(":RedeemRefund", StringComparison.OrdinalIgnoreCase) == true
            && refundedAtByOrder.TryGetValue(record.OrderId.Value, out var refundedAt)
                ? refundedAt : record.CreatedAt;
        records = records.OrderByDescending(EffectiveCreatedAt).ThenByDescending(record => record.Id).ToList();

        var runningBalance = user.FPoints;
        var history = new List<FPointTransactionDto>(records.Count);
        foreach (var record in records)
        {
            var transactionType = record.SourceKey?.EndsWith(":RedeemRefund", StringComparison.OrdinalIgnoreCase) == true
                ? "Refund"
                : record.PointUsed < 0 || record.SourceKey?.EndsWith(":Earn", StringComparison.OrdinalIgnoreCase) == true
                    ? "Earn" : "Redeem";
            history.Add(new FPointTransactionDto
            {
                Id = record.Id,
                UserId = record.UserId,
                OrderId = record.OrderId,
                PointUsed = record.PointUsed,
                BalanceAfter = runningBalance,
                TransactionType = transactionType,
                Description = record.Description ?? transactionType switch
                {
                    "Refund" => "Hoàn F-Point",
                    "Redeem" => "Sử dụng F-Point",
                    _ => "Tích lũy F-Point"
                },
                CreatedAt = EffectiveCreatedAt(record),
                Status = record.Status.ToString(),
                AvailableAt = record.AvailableAt
            });

            var affectedBalance = record.Status == PointStatus.Available
                || record.Status == PointStatus.Cancelled && (
                    record.PointUsed > 0
                    || record.OrderId.HasValue
                    && sourceKeys.Contains($"Order:{record.OrderId.Value}:EarnRevoke"));
            if (affectedBalance) runningBalance = checked(runningBalance + record.PointUsed);
        }

        IEnumerable<FPointTransactionDto> filtered = history;
        if (query.FromDate.HasValue)
            filtered = filtered.Where(item => item.CreatedAt >= query.FromDate.Value.Date);
        if (query.ToDate.HasValue)
        {
            var exclusiveEnd = query.ToDate.Value.Date.AddDays(1);
            filtered = filtered.Where(item => item.CreatedAt < exclusiveEnd);
        }
        if (!string.IsNullOrWhiteSpace(query.TransactionType))
        {
            var requestedType = query.TransactionType.Trim();
            if (requestedType is not ("Earn" or "Redeem" or "Refund"))
                throw new InvalidOperationException("Loại giao dịch F-Point không hợp lệ.");
            filtered = filtered.Where(item => item.TransactionType == requestedType);
        }

        var filteredItems = filtered.ToList();
        return new FPointHistoryResultDto
        {
            Items = filteredItems.Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize).ToList(),
            TotalCount = filteredItems.Count,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalEarned = filteredItems.Where(item => item.TransactionType == "Earn" && item.Status != PointStatus.Cancelled.ToString())
                .Sum(item => -item.PointUsed),
            TotalRedeemed = filteredItems.Where(item => item.TransactionType == "Redeem")
                .Sum(item => item.PointUsed),
            TotalRefunded = filteredItems.Where(item => item.TransactionType == "Refund")
                .Sum(item => -item.PointUsed)
        };
    }

    // Chỉ xem trước; Checkout kiểm tra lại giá sách và số dư điểm trong transaction.
    public async Task<UseFPointResponse> ValidateAndCalculatePointsAsync(int userId, UseFPointRequest request)
    {
        if (request.PointsToUse < 0 || request.TotalAmount < 0)
            throw new InvalidOperationException("Số điểm và tiền sách không được âm.");
        var user = await _db.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId && u.IsActive)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản đang hoạt động.");
        var limit = Math.Min(1000, await WorkflowSupport.IntSettingAsync(_db, "MAX_POINTS_PER_ORDER", 1000));
        var max = (int)Math.Min(int.MaxValue, decimal.Floor(request.TotalAmount / 100m));
        max = Math.Min(user.FPoints, Math.Min(limit, max));
        if (request.PointsToUse > max)
            throw new InvalidOperationException($"Chỉ được sử dụng tối đa {max} F-Point cho đơn này.");
        var used = request.PointsToUse;
        return new UseFPointResponse { PointsUsed = used, MaxPointsAllowed = max, DiscountAmount = used * 100m,
            FinalAmount = request.TotalAmount - used * 100m,
            Message = $"Sử dụng {used} F-Point." };
    }

    public async Task<List<MembershipTierDto>> GetMembershipTiersAsync()
    {
        // Đưa cấu hình hiện tại vào khóa cache để thay đổi SystemSettings có hiệu lực ngay.
        var settings = await _db.Set<SystemSetting>().AsNoTracking()
            .Where(s => s.SettingKey.StartsWith("POINT_RATE_") || s.SettingKey.StartsWith("MEMBER_UPGRADE_SPENDING_"))
            .OrderBy(s => s.SettingKey).ToListAsync();
        var signature = string.Join("|", settings.Select(s => s.SettingKey + "=" + s.SettingValue));
        var key = TierCacheKey + ":" + _cache.Get<string>("MembershipTierVersion") + ":" + signature;
        if (_cache.TryGetValue(key, out List<MembershipTierDto>? cached)) return cached!;
        var tiers = await _db.Set<MembershipTier>().AsNoTracking().Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder).ToListAsync();
        var result = tiers.Select(t =>
        {
            var suffix = t.TierName switch { "Đồng" => "BRONZE", "Bạc" => "SILVER", "Vàng" => "GOLD", _ => null };
            var rateSetting = settings.FirstOrDefault(s => s.SettingKey == "POINT_RATE_" + suffix)?.SettingValue;
            var spendingSetting = settings.FirstOrDefault(s => s.SettingKey == "MEMBER_UPGRADE_SPENDING_" + suffix)?.SettingValue;
            var rate = rateSetting != null && int.TryParse(rateSetting, out var r) ? r : t.PointRate;
            var spending = spendingSetting != null && decimal.TryParse(spendingSetting, NumberStyles.Number,
                CultureInfo.InvariantCulture, out var m) ? m : t.MinSpending;
            return new MembershipTierDto { Id = t.Id, TierName = t.TierName, MinSpending = spending,
                PointRate = rate, Benefits = t.Benefits };
        }).ToList();
        if (result.Any(t => t.MinSpending < 0 || t.PointRate < 0 || t.PointRate > 100))
            throw new InvalidOperationException("Cấu hình hạng thành viên không hợp lệ.");
        _cache.Set(key, result, TimeSpan.FromMinutes(5));
        return result;
    }

    public async Task<bool> AutoUpgradeTierAsync(int userId, int orderId, decimal totalSpent)
    {
        await using var tx = _db.Database.CurrentTransaction == null
            ? await _db.BeginWorkflowTransactionAsync() : null;
        await WorkflowSupport.LockUserAsync(_db, userId);
        var user = await _db.Set<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsActive) return false;
        // Tính lại chi tiêu từ đơn hoàn thành, đã thanh toán; không dùng tổng tiền do bên gọi truyền vào.
        user.TotalSpent = await _db.Set<Order>().Where(o => o.UserId == userId
            && o.Status == OrderStatus.Completed && o.IsPaid).SumAsync(o => (decimal?)o.FinalAmount) ?? 0;
        var tiers = await GetMembershipTiersAsync();
        var current = tiers.FirstOrDefault(t => t.Id == user.MembershipTierId) ?? tiers.FirstOrDefault();
        var next = tiers.Where(t => t.MinSpending <= user.TotalSpent).OrderByDescending(t => t.MinSpending)
            .ThenByDescending(t => tiers.IndexOf(t)).FirstOrDefault();
        var upgraded = next != null && tiers.IndexOf(next) > (current == null ? -1 : tiers.IndexOf(current));
        if (upgraded)
        {
            var before = user.MembershipTierId;
            var beforeTier = current?.TierName ?? "Đồng";
            var upgradedAt = TimeZoneHelper.GetVietnamTime();
            user.MembershipTierId = next!.Id;
            user.UpdatedAt = upgradedAt;
            user.UpdatedBy = "System";
            int? triggerId = orderId > 0 && await _db.Set<Order>().AnyAsync(o => o.Id == orderId
                && o.UserId == userId && o.Status == OrderStatus.Completed && o.IsPaid) ? orderId : null;
            _db.Set<TierHistory>().Add(new TierHistory { UserId = userId,
                FromTier = beforeTier, ToTier = next.TierName,
                TotalSpendingAtChange = user.TotalSpent, TriggerOrderId = triggerId,
                ChangedAt = upgradedAt, ChangedBy = "System", CreatedBy = "System" });
            WorkflowSupport.Audit(_db, "AUTO_UPGRADE_TIER", "User", userId,
                new { MembershipTierId = before, TierName = beforeTier },
                new { user.MembershipTierId, TierName = next.TierName, TotalSpending = user.TotalSpent, TierUpgradedAt = upgradedAt },
                details: $"System tự động nâng hạng {beforeTier} -> {next.TierName}; tổng chi tiêu {user.TotalSpent:N0} đ.");
            WorkflowSupport.Notify(_db,
                $"Chúc mừng bạn đã lên hạng {next.TierName}! Tỉ lệ tích điểm: {next.PointRate}%. {next.Benefits}",
                triggerId, userId);
        }
        else if (!user.MembershipTierId.HasValue && current != null)
            user.MembershipTierId = current.Id;
        await _db.SaveChangesAsync();
        if (tx != null) await tx.CommitAsync();
        return upgraded;
    }

    public async Task<int> AwardCompletedOrderAsync(int orderId)
    {
        await using var tx = _db.Database.CurrentTransaction == null
            ? await _db.BeginWorkflowTransactionAsync() : null;
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        if (order.Status != OrderStatus.Completed || !order.IsPaid)
            throw new InvalidOperationException("Chỉ cộng điểm cho đơn hoàn thành và đã thanh toán.");
        await WorkflowSupport.LockUserAsync(_db, order.UserId);
        var key = $"Order:{orderId}:Earn";
        if (await _db.Set<FPoints>().AnyAsync(p => p.SourceKey == key)) return 0;
        var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
        var tiers = await GetMembershipTiersAsync();
        var tier = tiers.FirstOrDefault(t => t.Id == user.MembershipTierId) ?? tiers.FirstOrDefault();
        // Cộng điểm theo hạng hiện tại trước khi xét nâng hạng từ đơn này.
        var points = checked((int)decimal.Floor(order.FinalAmount * (tier?.PointRate ?? 5) / 100m / 100m));
        if (points <= 0) return 0;
        var physical = await _db.Set<OrderItem>().AnyAsync(i => i.OrderId == orderId
            && i.PurchaseType == PurchaseType.Physical);
        var now = TimeZoneHelper.GetVietnamTime();
        var availableAt = physical ? await GetReturnDeadlineAsync(order) : now;
        var pending = physical && !order.ReceiptConfirmedAt.HasValue && availableAt > now;
        var before = user.FPoints;
        if (!pending) user.FPoints = checked(user.FPoints + points);
        _db.Set<FPoints>().Add(new FPoints { UserId = user.Id, OrderId = orderId,
            PointUsed = -points, SourceKey = key, Description = $"Tích điểm đơn #{orderId}", CreatedBy = "System",
            Status = pending ? PointStatus.Pending : PointStatus.Available, AvailableAt = availableAt });
        WorkflowSupport.Audit(_db, pending ? "OrderPointsPending" : "PointsEarned", "User", user.Id,
            new { FPoints = before }, new { user.FPoints, PendingPoints = pending ? points : 0 },
            details: $"Đơn #{orderId}: {points} điểm {(pending ? "chờ duyệt" : "khả dụng")}.");
        await _db.SaveChangesAsync();
        await AutoUpgradeTierAsync(user.Id, orderId, 0);
        if (tx != null) await tx.CommitAsync();
        return points;
    }

    public async Task ProcessPaidDigitalOrderAsync(int orderId)
    {
        await using var tx = _db.Database.CurrentTransaction == null
            ? await _db.BeginWorkflowTransactionAsync() : null;
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null || !order.IsPaid || order.Status is OrderStatus.Failed or OrderStatus.Returned) return;
        if (order.Status != OrderStatus.Completed)
        {
            if (!order.OrderItems.Any() || order.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical)) return;
            if (order.Status is not (OrderStatus.Pending or OrderStatus.Confirmed)) return;
            var previous = order.Status;
            order.Status = OrderStatus.Completed;
            WorkflowSupport.StatusHistory(_db, order, previous, "System", "Thanh toán sách Online thành công.");
            WorkflowSupport.Audit(_db, "DigitalOrderCompleted", "Order", orderId,
                new { Status = previous }, new { order.Status });
            await _db.SaveChangesAsync();
        }
        await AwardCompletedOrderAsync(orderId);
        if (tx != null) await tx.CommitAsync();
    }

    public async Task<bool> UpdateMembershipTierAsync(int id, MembershipTierDto dto, int? actorUserId = null)
    {
        if (dto.MinSpending < 0 || dto.PointRate < 0 || dto.PointRate > 100)
            throw new InvalidOperationException("Mốc chi tiêu và tỷ lệ tích điểm không hợp lệ.");
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        var tier = await _db.Set<MembershipTier>().FirstOrDefaultAsync(t => t.Id == id);
        if (tier == null) return false;
        var old = new { tier.MinSpending, tier.PointRate, tier.Benefits };
        tier.MinSpending = dto.MinSpending; tier.PointRate = dto.PointRate; tier.Benefits = dto.Benefits;
        tier.UpdatedBy = "Admin";
        // Đồng bộ cấu hình hạng với các khóa SystemSettings tương ứng.
        var suffix = tier.TierName switch { "Đồng" => "BRONZE", "Bạc" => "SILVER", "Vàng" => "GOLD", _ => null };
        if (suffix != null)
        {
            foreach (var (key, value) in new[] {
                ("POINT_RATE_" + suffix, dto.PointRate.ToString(CultureInfo.InvariantCulture)),
                ("MEMBER_UPGRADE_SPENDING_" + suffix, dto.MinSpending.ToString(CultureInfo.InvariantCulture)) })
            {
                var setting = await _db.Set<SystemSetting>().FirstOrDefaultAsync(s => s.SettingKey == key);
                if (setting != null) setting.SettingValue = value;
            }
        }
        WorkflowSupport.Audit(_db, "TierConfigurationUpdated", "MembershipTier", id, old,
            new { tier.MinSpending, tier.PointRate, tier.Benefits }, actorUserId);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        // Đổi phiên bản cache để các lần đọc tiếp theo sử dụng cấu hình hạng mới.
        _cache.Set("MembershipTierVersion", Guid.NewGuid().ToString());
        return true;
    }

    public async Task<int> AdminApproveOrderPointsAsync(int orderId, int adminUserId)
    {
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);

        var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

        if (order.Status != OrderStatus.Completed || !order.IsPaid)
            throw new InvalidOperationException("Chỉ có thể duyệt cộng điểm cho đơn hàng đã hoàn thành và thanh toán.");

        await WorkflowSupport.LockUserAsync(_db, order.UserId);
        var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
        var key = $"Order:{orderId}:Earn";
        var earnRecord = await _db.Set<FPoints>().FirstOrDefaultAsync(p => p.SourceKey == key);

        if (earnRecord == null)
        {
            var tiers = await GetMembershipTiersAsync();
            var tier = tiers.FirstOrDefault(t => t.Id == user.MembershipTierId) ?? tiers.FirstOrDefault();
            var points = checked((int)decimal.Floor(order.FinalAmount * (tier?.PointRate ?? 5) / 100m / 100m));
            if (points <= 0)
                throw new InvalidOperationException("Đơn hàng này không phát sinh điểm thưởng.");

            var before = user.FPoints;
            user.FPoints = checked(user.FPoints + points);
            var now = TimeZoneHelper.GetVietnamTime();

            _db.Set<FPoints>().Add(new FPoints
            {
                UserId = user.Id,
                OrderId = orderId,
                PointUsed = -points,
                SourceKey = key,
                Description = $"Admin duyệt cộng điểm đơn #{orderId}",
                CreatedBy = $"Admin:{adminUserId}",
                Status = PointStatus.Available,
                AvailableAt = now
            });

            WorkflowSupport.Audit(_db, "AdminApprovedPoints", "User", user.Id,
                new { FPoints = before }, new { user.FPoints }, adminUserId,
                details: $"Admin duyệt cộng {points} điểm cho đơn #{orderId}.");

            await _db.SaveChangesAsync();
            await AutoUpgradeTierAsync(user.Id, orderId, 0);
            await tx.CommitAsync();
            return points;
        }

        if (earnRecord.Status == PointStatus.Available)
            throw new InvalidOperationException("Điểm của đơn hàng này đã được cộng khả dụng trước đó.");

        if (earnRecord.Status != PointStatus.Pending)
            throw new InvalidOperationException($"Không thể duyệt điểm ở trạng thái {earnRecord.Status}.");

        var pendingPoints = checked(-earnRecord.PointUsed);
        var prevPoints = user.FPoints;

        earnRecord.Status = PointStatus.Available;
        earnRecord.AvailableAt = TimeZoneHelper.GetVietnamTime();
        earnRecord.Description = $"Admin duyệt cộng điểm đơn #{orderId}";
        user.FPoints = checked(user.FPoints + pendingPoints);

        WorkflowSupport.Audit(_db, "AdminApprovedPoints", "User", user.Id,
            new { FPoints = prevPoints }, new { user.FPoints }, adminUserId,
            details: $"Admin duyệt sớm {pendingPoints} điểm chờ cho đơn #{orderId}.");

        await _db.SaveChangesAsync();
        await AutoUpgradeTierAsync(user.Id, orderId, 0);
        await tx.CommitAsync();
        return pendingPoints;
    }

    public async Task<int> AdminRevokeOrderPointsAsync(int orderId, int adminUserId, string? reason = null)
    {
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);

        var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

        await WorkflowSupport.LockUserAsync(_db, order.UserId);
        var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);

        var key = $"Order:{orderId}:Earn";
        var earnRecord = await _db.Set<FPoints>().FirstOrDefaultAsync(p => p.SourceKey == key)
            ?? throw new InvalidOperationException("Đơn hàng này chưa có lịch sử tích điểm để thu hồi.");

        var revokeKey = $"Order:{orderId}:Revoke";
        if (await _db.Set<FPoints>().AnyAsync(p => p.SourceKey == revokeKey))
            throw new InvalidOperationException("Điểm thưởng của đơn hàng này đã bị thu hồi trước đó.");

        int pointsToRevoke = checked(-earnRecord.PointUsed);
        if (pointsToRevoke <= 0)
            throw new InvalidOperationException("Số điểm tích lũy không hợp lệ.");

        var prevPoints = user.FPoints;
        var note = string.IsNullOrWhiteSpace(reason) ? "Admin thu hồi điểm cộng sai" : reason.Trim();

        if (earnRecord.Status == PointStatus.Pending)
        {
            earnRecord.Status = PointStatus.Cancelled;
            earnRecord.Description = $"Đã hủy điểm chờ đơn #{orderId} ({note})";
        }
        else if (earnRecord.Status == PointStatus.Available)
        {
            var actualDeducted = Math.Min(user.FPoints, pointsToRevoke);
            user.FPoints -= actualDeducted;
            earnRecord.Status = PointStatus.Cancelled;

            _db.Set<FPoints>().Add(new FPoints
            {
                UserId = user.Id,
                OrderId = orderId,
                PointUsed = actualDeducted, // Positive = deduction
                SourceKey = revokeKey,
                Description = $"Thu hồi {actualDeducted} điểm đơn #{orderId}: {note}",
                CreatedBy = $"Admin:{adminUserId}",
                Status = PointStatus.Available,
                AvailableAt = TimeZoneHelper.GetVietnamTime()
            });
        }
        else
        {
            throw new InvalidOperationException($"Không thể thu hồi điểm đang ở trạng thái {earnRecord.Status}.");
        }

        WorkflowSupport.Audit(_db, "AdminRevokedPoints", "User", user.Id,
            new { FPoints = prevPoints }, new { user.FPoints }, adminUserId,
            details: $"Admin thu hồi {pointsToRevoke} điểm từ đơn #{orderId}. Lý do: {note}");

        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return pointsToRevoke;
    }

    public async Task<int> ReleaseDuePendingPointsAsync()
    {
        var now = TimeZoneHelper.GetVietnamTime();
        var dueOrderIds = await _db.Set<FPoints>()
            .AsNoTracking()
            .Where(p => p.Status == PointStatus.Pending && p.AvailableAt <= now && p.OrderId != null)
            .Select(p => p.OrderId!.Value)
            .Distinct()
            .Take(100)
            .ToListAsync();

        int releasedCount = 0;
        foreach (var orderId in dueOrderIds)
        {
            await using var tx = await _db.BeginWorkflowTransactionAsync();
            await WorkflowSupport.LockOrderAsync(_db, orderId);

            var order = await _db.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null || order.Status != OrderStatus.Completed || !order.IsPaid)
            {
                await tx.CommitAsync();
                continue;
            }

            await WorkflowSupport.LockUserAsync(_db, order.UserId);
            var record = await _db.Set<FPoints>()
                .FirstOrDefaultAsync(p => p.OrderId == orderId && p.SourceKey == $"Order:{orderId}:Earn" && p.Status == PointStatus.Pending);

            if (record != null && record.AvailableAt <= now)
            {
                var user = await _db.Set<User>().FirstAsync(u => u.Id == order.UserId);
                var pts = checked(-record.PointUsed);
                var before = user.FPoints;

                record.Status = PointStatus.Available;
                user.FPoints = checked(user.FPoints + pts);

                WorkflowSupport.Audit(_db, "AutoPointsReleased", "User", user.Id,
                    new { FPoints = before }, new { user.FPoints },
                    details: $"Tự động cộng {pts} điểm sau 3 ngày hoàn thành đơn #{orderId}.");

                await _db.SaveChangesAsync();
                await AutoUpgradeTierAsync(user.Id, orderId, 0);
                releasedCount++;
            }

            await tx.CommitAsync();
        }

        return releasedCount;
    }
}
