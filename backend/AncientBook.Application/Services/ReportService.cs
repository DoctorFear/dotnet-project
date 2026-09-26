using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;
        private readonly IReportPdfExporter _reportPdfExporter;

        public ReportService(IReportRepository reportRepository, IReportPdfExporter reportPdfExporter)
        {
            _reportRepository = reportRepository;
            _reportPdfExporter = reportPdfExporter;
        }

        // Lấy dữ liệu thống kê tổng quan 
        public async Task<DashboardReportDto> GetDashboardReportAsync()
        {
            var totalBooks = await _reportRepository.CountBooksAsync();
            var totalSelling = await _reportRepository.CountSellingBooksAsync();
            var totalLowStock = await _reportRepository.CountLowStockBooksAsync(5);
            var totalRevenue = await _reportRepository.GetTotalRevenueAsync();
            var topBooks = await _reportRepository.GetTopSellingBooksAsync(5);

            return new DashboardReportDto
            {
                TotalBooks = totalBooks,
                TotalSellingBooks = totalSelling,
                TotalLowStockBooks = totalLowStock,
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
    }
} 
