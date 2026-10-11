using AncientBook.Application.Interfaces;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;

namespace AncientBook.Infrastructure.Services;

// Đối soát định kỳ điểm và hạng, bổ sung cho xử lý ngay khi đơn hoàn thành hoặc thanh toán online.
public class TierUpgradeBackgroundService(IServiceScopeFactory scopes, ILogger<TierUpgradeBackgroundService> logger) : BackgroundService
{
    private const int BatchSize = 100;
    private int lastOrderId;
    private int lastUserId;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await ReconcileBatchAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
                catch (Exception ex) { logger.LogError(ex, "Lỗi đối soát điểm/hạng; sẽ thử lại."); }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
    }

    // Đọc từng nhóm có giới hạn và quay vòng ID để đơn lỗi không chặn các đơn phía sau.
    public async Task ReconcileBatchAsync(CancellationToken stoppingToken)
    {
        List<int> orderIds;
        List<int> userIds;
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                orderIds = await db.Orders.AsNoTracking().Where(o => o.Id > lastOrderId && o.IsPaid &&
                    (o.Status == OrderStatus.Completed && !db.FPoints.Any(p => p.SourceKey == "Order:" + o.Id + ":Earn") ||
                     (o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed) &&
                     o.OrderItems.Any() && !o.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical)))
                    .OrderBy(o => o.Id).Select(o => o.Id).Take(BatchSize).ToListAsync(stoppingToken);
                userIds = await db.Users.AsNoTracking().Where(u => u.Id > lastUserId && u.IsActive && u.Role == UserRole.Member &&
                    db.Orders.Any(o => o.UserId == u.Id && o.Status == OrderStatus.Completed && o.IsPaid))
                    .OrderBy(u => u.Id).Select(u => u.Id).Take(BatchSize).ToListAsync(stoppingToken);
                break;
            }
            catch (Exception ex) when (attempt < 2 && !stoppingToken.IsCancellationRequested &&
                IsReadTimeout(ex))
            {
                // Chỉ thử lại truy vấn danh sách; không chạy lại transaction hoặc thay đổi tồn kho ở đây.
                logger.LogWarning("SQL timeout khi đọc danh sách đối soát; thử lại {Attempt}/2.", attempt + 1);
                await Task.Delay(TimeSpan.FromSeconds(attempt + 1), stoppingToken);
            }
        }
        lastOrderId = orderIds.Count == BatchSize ? orderIds[^1] : 0;
        lastUserId = userIds.Count == BatchSize ? userIds[^1] : 0;
        foreach (var orderId in orderIds)
        {
            stoppingToken.ThrowIfCancellationRequested();
            using var scope = scopes.CreateScope();
            try { await scope.ServiceProvider.GetRequiredService<IFPointService>().ProcessPaidDigitalOrderAsync(orderId); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
            catch (Exception ex) { logger.LogWarning(ex, "Chưa thể đối soát điểm đơn #{OrderId}; sẽ thử lại.", orderId); }
        }
        foreach (var userId in userIds)
        {
            stoppingToken.ThrowIfCancellationRequested();
            using var scope = scopes.CreateScope();
            try { await scope.ServiceProvider.GetRequiredService<IFPointService>().AutoUpgradeTierAsync(userId, 0, 0); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
            catch (Exception ex) { logger.LogWarning(ex, "Chưa thể đối soát hạng tài khoản #{UserId}; sẽ thử lại.", userId); }
        }
    }

    private static bool IsReadTimeout(Exception ex) => ex is TimeoutException or SqlException { Number: -2 } ||
        ex is InvalidOperationException { InnerException: not null } && IsReadTimeout(ex.InnerException);
}
