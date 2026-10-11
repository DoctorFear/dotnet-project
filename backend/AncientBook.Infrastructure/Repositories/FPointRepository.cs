using System.Data;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories;

public class FPointsRepository : IFPointRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IFPointService _loyalty;
    public FPointsRepository(ApplicationDbContext context, IFPointService loyalty)
    { _context = context; _loyalty = loyalty; }

    public async Task AddAsync(FPoints record)
    { _context.FPoints.Add(record); await _context.SaveChangesAsync(); }

    public Task<FPoints?> GetAsync(int userId, int? orderId) => _context.FPoints
        .FirstOrDefaultAsync(p => p.UserId == userId && p.OrderId == orderId && p.PointUsed > 0);

    public Task<List<FPoints>> GetByUserIdAsync(int userId) => _context.FPoints.AsNoTracking()
        .Where(p => p.UserId == userId).OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id).ToListAsync();

    public async Task<int> GetCurrentUserPointsAsync(int userId) => await _context.Users.AsNoTracking()
        .Where(u => u.Id == userId).Select(u => u.FPoints).FirstOrDefaultAsync();

    public async Task IncreasePointsAsync(int userId, int points, int? orderId = null)
    {
        if (points < 0) throw new InvalidOperationException("Số điểm cộng không được âm.");
        await using var tx = _context.Database.CurrentTransaction == null
            ? await _context.BeginWorkflowTransactionAsync() : null;
        await _context.LockUserAsync(userId);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản.");
        var before = user.FPoints; user.FPoints = checked(before + points);
        _context.FPoints.Add(new FPoints { UserId = userId, OrderId = orderId, PointUsed = -points,
            Description = "Cộng F-Point" });
        PointAudit(userId, before, user.FPoints, "PointsEarned", orderId);
        await _context.SaveChangesAsync();
        if (tx != null) await tx.CommitAsync();
    }

    public async Task DecreasePointsAsync(int userId, int points, int? orderId = null)
    {
        if (points < 0) throw new InvalidOperationException("Số điểm sử dụng không được âm.");
        await using var tx = _context.Database.CurrentTransaction == null
            ? await _context.BeginWorkflowTransactionAsync() : null;
        Order? order = null;
        if (orderId.HasValue)
        {
            await _context.LockOrderAsync(orderId.Value);
            order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId.Value)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
            if (order.UserId != userId || order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Chỉ sử dụng điểm cho đơn mới của chính khách hàng.");
            var existing = await _context.FPoints.FirstOrDefaultAsync(p => p.SourceKey == $"Order:{order.Id}:Redeem");
            if (existing != null)
            {
                if (existing.PointUsed != points) throw new InvalidOperationException("Đơn đã sử dụng điểm khác với yêu cầu.");
                return;
            }
        }
        await _context.LockUserAsync(userId);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản đang hoạt động.");
        var max = user.FPoints;
        if (order != null)
        {
            var value = await _context.SystemSettings.Where(s => s.SettingKey == "MAX_POINTS_PER_ORDER")
                .Select(s => s.SettingValue).FirstOrDefaultAsync();
            var cap = value == null ? 1000 : int.TryParse(value, out var configured) && configured >= 0
                ? configured : throw new InvalidOperationException("Hạn mức điểm không hợp lệ.");
            max = Math.Min(max, Math.Min(Math.Min(1000, cap), (int)Math.Min(int.MaxValue, decimal.Floor(order.SubTotal / 200m))));
        }
        if (points > max) throw new InvalidOperationException($"Chỉ được sử dụng tối đa {max} F-Point.");
        var before = user.FPoints; user.FPoints -= points;
        var record = new FPoints { UserId = userId, OrderId = orderId, PointUsed = points,
            SourceKey = order != null ? $"Order:{order.Id}:Redeem" : null, Description = "Sử dụng F-Point" };
        _context.FPoints.Add(record);
        PointAudit(userId, before, user.FPoints, "PointsRedeemed", orderId);
        await _context.SaveChangesAsync();
        if (order != null) { order.PointsId = record.Id; await _context.SaveChangesAsync(); }
        if (tx != null) await tx.CommitAsync();
    }

    public async Task<int> CalculateAndAwardPointsAsync(int userId, decimal totalAmount, int? orderId = null)
    {
        if (!orderId.HasValue) return 0;
        var order = await _context.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId.Value && o.UserId == userId);
        if (order == null || order.Status != OrderStatus.Completed || !order.IsPaid) return 0;
        return await _loyalty.AwardCompletedOrderAsync(order.Id);
    }

    private void PointAudit(int userId, int before, int after, string action, int? orderId) =>
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = action == "PointsRedeemed" ? userId : null, Action = action, Module = "LOYALTY",
            EntityName = "User", RecordId = userId.ToString(),
            OldValues = System.Text.Json.JsonSerializer.Serialize(new { FPoints = before }),
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { FPoints = after }),
            Details = orderId.HasValue ? $"Đơn #{orderId}" : null, Timestamp = TimeZoneHelper.GetVietnamTime()
        });
}
