using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.Interfaces;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        // Lấy dữ liệu KPI & Top sách bán chạy cho Dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardReport()
        {
            var result = await _reportService.GetDashboardReportAsync();
            return Ok(result);
        }

        // Xuất file PDF báo cáo danh sách & doanh thu sách
        [HttpGet("export-pdf")]
        public async Task<IActionResult> ExportPdf()
        {
            var pdfBytes = await _reportService.ExportPdfReportAsync();
            return File(pdfBytes, "application/pdf", "BaoCao_AncientBook.pdf");
        }
    }
}