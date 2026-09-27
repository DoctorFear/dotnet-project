using System.Threading.Tasks;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    // Interface xử lý Thống kê & Báo cáo PDF 
    public interface IReportService
    {
        Task<DashboardReportDto> GetDashboardReportAsync();
        Task<byte[]> ExportPdfReportAsync();
    }
}