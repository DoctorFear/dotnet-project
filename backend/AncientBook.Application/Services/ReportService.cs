using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;

namespace AncientBook.Application.Services;

public class ReportService(IReportRepository reports, IReportPdfExporter exporter, ISystemSettingRepository settings) : IReportService
{
    public async Task<DashboardReportDto> GetDashboardReportAsync(ReportFilterDto? filter = null)
    {
        var normalized = Normalize(filter ?? new ReportFilterDto());
        var report = await reports.GetDashboardAsync(normalized, await StockWarningPolicy.GetThresholdAsync(settings));
        report.FromDate = normalized.FromDate!.Value;
        report.ToDate = normalized.ToDate!.Value;
        report.GeneratedAt = TimeZoneHelper.GetVietnamTime();
        report.PurchaseType = normalized.PurchaseType!;
        var periods = report.RevenueTrend.ToDictionary(period => period.Date.Date);
        report.RevenueTrend = [];
        for (var date = report.FromDate; date <= report.ToDate; date = date.AddDays(1))
            report.RevenueTrend.Add(periods.GetValueOrDefault(date) ?? new RevenuePeriodDto { Date = date });
        return report;
    }

    public async Task<byte[]> ExportPdfReportAsync(ReportFilterDto? filter = null, string exportedBy = "Admin", bool detailed = false)
    {
        filter = Normalize(filter ?? new ReportFilterDto());
        var report = await GetDashboardReportAsync(filter);
        report.ExportedBy = exportedBy;
        report.DetailedExport = detailed;
        if (detailed)
        {
            for (var page = 1; ; page++)
            {
                var stock = await reports.GetLowStockBooksAsync(filter, report.LowStockThreshold, page, 100);
                report.ExportInventory.AddRange(stock.Items);
                if (page >= stock.TotalPages) break;
            }
        }
        return exporter.Export(report);
    }

    private static ReportFilterDto Normalize(ReportFilterDto filter)
    {
        var today = TimeZoneHelper.GetVietnamTime().Date;
        var from = (filter.FromDate ?? new DateTime(today.Year, today.Month, 1)).Date;
        var to = (filter.ToDate ?? today).Date;
        if (from > to || (to - from).Days > 365 || to == DateTime.MaxValue.Date)
            throw new ArgumentException("Khoảng thời gian phải hợp lệ và không vượt quá 366 ngày.");
        var type = (filter.PurchaseType ?? "all").ToLowerInvariant();
        if (type is not ("all" or "physical" or "rental") || filter.CategoryId is <= 0 || filter.PublisherId is <= 0)
            throw new ArgumentException("Bộ lọc báo cáo không hợp lệ.");
        return new ReportFilterDto
        {
            FromDate = from, ToDate = to, CategoryId = filter.CategoryId, PublisherId = filter.PublisherId, PurchaseType = type,
            TopPage = Math.Max(1, filter.TopPage), TopPageSize = Math.Clamp(filter.TopPageSize, 1, 10),
            InventoryPage = Math.Max(1, filter.InventoryPage), InventoryPageSize = Math.Clamp(filter.InventoryPageSize, 1, 100)
        };
    }
} 
