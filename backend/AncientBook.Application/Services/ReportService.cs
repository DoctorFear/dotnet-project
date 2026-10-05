using System.Linq;
using System.Threading.Tasks;
using System.Globalization;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;
        private readonly IReportPdfExporter _reportPdfExporter;
        private readonly ISystemSettingRepository _systemSettingRepository;

        public ReportService(
            IReportRepository reportRepository,
            IReportPdfExporter reportPdfExporter,
            ISystemSettingRepository systemSettingRepository)
        {
            _reportRepository = reportRepository;
            _reportPdfExporter = reportPdfExporter;
            _systemSettingRepository = systemSettingRepository;
        }

        // Lấy dữ liệu thống kê tổng quan 
        public async Task<DashboardReportDto> GetDashboardReportAsync()
        {
            var totalBooks = await _reportRepository.CountBooksAsync();
            var totalSelling = await _reportRepository.CountSellingBooksAsync();
            var lowStockThreshold = await GetLowStockThresholdAsync();
            var totalLowStock = await _reportRepository.CountLowStockBooksAsync(lowStockThreshold);
            var totalRevenue = await _reportRepository.GetTotalRevenueAsync();
            var topBooks = await _reportRepository.GetTopSellingBooksAsync(5);

            return new DashboardReportDto
            {
                TotalBooks = totalBooks,
                TotalSellingBooks = totalSelling,
                TotalLowStockBooks = totalLowStock,
                LowStockThreshold = lowStockThreshold,
                TotalRevenue = totalRevenue,
                TopBooks = topBooks
            };
        }

        // Xuất file PDF báo cáo 
        public async Task<byte[]> ExportPdfReportAsync()
        {
            var report = await GetDashboardReportAsync();
            return _reportPdfExporter.Export(report);
        }

        private async Task<int> GetLowStockThresholdAsync()
        {
            var setting = await _systemSettingRepository.GetByKeyAsync("LOW_STOCK_THRESHOLD");

            return setting != null &&
                   int.TryParse(setting.SettingValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var threshold) &&
                   threshold >= 0
                ? threshold
                : 5;
        }
    }
} 
