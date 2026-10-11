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

public class FPointService : IFPointService
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
        var earned = await _db.Set<FPoints>().Where(p => p.UserId == userId && p.PointUsed < 0)
            .SumAsync(p => (int?)-p.PointUsed) ?? 0;
        return new FPointBalanceDto { UserId = user.Id, CurrentPoints = user.FPoints,
            TotalPointsEarned = earned, TotalSpent = user.TotalSpent,
            TierName = tier?.TierName ?? "Đồng", PointRate = tier?.PointRate ?? 5 };
    }

    public async Task<PagedResult<FPointTransactionDto>> GetHistoryAsync(int userId, int pageNumber, int pageSize)
    {
        pageNumber = Math.Max(1, pageNumber); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _db.Set<FPoints>().AsNoTracking().Where(p => p.UserId == userId);
        var count = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(p => new FPointTransactionDto
            {
                Id = p.Id, UserId = p.UserId, OrderId = p.OrderId, PointUsed = p.PointUsed,
                TransactionType = p.PointUsed < 0 || p.SourceKey != null && p.SourceKey.EndsWith(":Earn") ? "Earn" : "Redeem",
                Description = p.Description ?? (p.PointUsed >= 0 ? "Sử dụng điểm" : "Tích lũy điểm"),
                CreatedAt = p.CreatedAt
            }).ToListAsync();
        return new(items, count, pageNumber, pageSize);
    }

    // Chỉ xem trước; Checkout kiểm tra lại giá sách và số dư điểm trong transaction.
    public async Task<UseFPointResponse> ValidateAndCalculatePointsAsync(int userId, UseFPointRequest request)
    {
        if (request.PointsToUse < 0 || request.TotalAmount < 0)
            throw new InvalidOperationException("Số điểm và tiền sách không được âm.");
        var user = await _db.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId && u.IsActive)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản đang hoạt động.");
        var limit = Math.Min(1000, await WorkflowSupport.IntSettingAsync(_db, "MAX_POINTS_PER_ORDER", 1000));
        var max = (int)Math.Min(int.MaxValue, decimal.Floor(request.TotalAmount / 200m));
        max = Math.Min(user.FPoints, Math.Min(limit, max));
        var used = Math.Min(request.PointsToUse, max);
        return new UseFPointResponse { PointsUsed = used, DiscountAmount = used * 100m,
            FinalAmount = request.TotalAmount - used * 100m,
            Message = request.PointsToUse > max ? $"Chỉ được sử dụng tối đa {max} F-Point cho đơn này."
                : $"Sử dụng {used} F-Point." };
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
            user.MembershipTierId = next!.Id;
            user.UpdatedBy = "System";
            int? triggerId = orderId > 0 && await _db.Set<Order>().AnyAsync(o => o.Id == orderId
                && o.UserId == userId && o.Status == OrderStatus.Completed && o.IsPaid) ? orderId : null;
            _db.Set<TierHistory>().Add(new TierHistory { UserId = userId,
                FromTier = current?.TierName ?? "Đồng", ToTier = next.TierName,
                TotalSpendingAtChange = user.TotalSpent, TriggerOrderId = triggerId,
                ChangedAt = TimeZoneHelper.GetVietnamTime(), ChangedBy = "System", CreatedBy = "System" });
            WorkflowSupport.Audit(_db, "TierUpgrade", "User", userId,
                new { MembershipTierId = before }, new { user.MembershipTierId, user.TotalSpent });
            WorkflowSupport.Notify(_db, $"Chúc mừng bạn đã lên hạng {next.TierName}! Tỉ lệ tích điểm: {next.PointRate}%.",
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
        var before = user.FPoints;
        user.FPoints = checked(user.FPoints + points);
        _db.Set<FPoints>().Add(new FPoints { UserId = user.Id, OrderId = orderId,
            PointUsed = -points, SourceKey = key, Description = $"Tích điểm đơn #{orderId}", CreatedBy = "System" });
        WorkflowSupport.Audit(_db, "PointsEarned", "User", user.Id, new { FPoints = before },
            new { user.FPoints }, details: $"Đơn #{orderId}: +{points} điểm.");
        await _db.SaveChangesAsync();
        await AutoUpgradeTierAsync(user.Id, orderId, 0);
        if (tx != null) await tx.CommitAsync();
        return points;
    }

    public async Task ProcessPaidDigitalOrderAsync(int orderId)
    {
        await using var tx = await _db.BeginWorkflowTransactionAsync();
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
        await tx.CommitAsync();
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
}
