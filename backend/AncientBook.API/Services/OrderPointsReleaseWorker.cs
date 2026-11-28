using System;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AncientBook.API.BackgroundServices;

public class OrderPointsReleaseWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderPointsReleaseWorker> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    public OrderPointsReleaseWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderPointsReleaseWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OrderLoyaltyBackgroundWorker đã khởi động.");

        // Short delay on startup so the web host finishes booting first
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var checkoutService = scope.ServiceProvider.GetRequiredService<ICheckoutService>();
                int paidCount = await checkoutService.ReconcileUnpaidOnlineOrdersAsync(stoppingToken);
                if (paidCount > 0)
                {
                    _logger.LogInformation("BackgroundWorker: Đã đồng bộ thanh toán thành công cho {Count} đơn hàng.", paidCount);
                }


                var fpointService = scope.ServiceProvider.GetRequiredService<IFPointService>();
                int releasedCount = await fpointService.ReleaseDuePendingPointsAsync();
                if (releasedCount > 0)
                {
                    _logger.LogInformation("BackgroundWorker: Đã tự động cộng điểm khả dụng cho {Count} đơn hàng quá 5 ngày.", releasedCount);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình chạy OrderLoyaltyBackgroundWorker.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }
}