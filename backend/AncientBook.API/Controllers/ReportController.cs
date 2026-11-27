using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.Interfaces;
using AncientBook.Application.DTOs;
using System.Security.Claims;

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

        // Lấy thống kê doanh thu, sách giao dịch và tồn kho.
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardReport([FromQuery] ReportFilterDto filter)
        {
            try
            {
                var report = await _reportService.GetDashboardReportAsync(filter);
                return Ok(report);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Xuất file PDF báo cáo danh sách & doanh thu sách.
        [HttpGet("export-pdf")]
        public async Task<IActionResult> ExportPdf([FromQuery] ReportFilterDto filter, [FromQuery] bool detailed = false)
        {
            try
            {
                var exportedBy = User.FindFirstValue(ClaimTypes.Name)
                    ?? User.FindFirstValue(ClaimTypes.Email)
                    ?? "Quản trị viên";
                var pdfBytes = await _reportService.ExportPdfReportAsync(filter, exportedBy, detailed);
                return File(pdfBytes, "application/pdf", "BaoCao_AncientBook.pdf");
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}