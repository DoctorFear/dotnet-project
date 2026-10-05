using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet("alerts/active")]
        public async Task<IActionResult> GetActiveAlerts()
        {
            var result = await _inventoryService.GetActiveAlertsAsync();
            return Ok(result);
        }

        [HttpPost("alerts/scan")]
        public async Task<IActionResult> ScanStockAlerts()
        {
            var result = await _inventoryService.CheckAndGenerateStockAlertsAsync();
            return Ok(result);
        }

        [HttpPut("alerts/{id}/resolve")]
        public async Task<IActionResult> ResolveAlert(int id)
        {
            var success = await _inventoryService.ResolveAlertAsync(id);
            if (!success) return NotFound();
            return Ok(new { message = "Cảnh báo đã được đánh dấu xử lý." });
        }

        [HttpPut("threshold")]
        public async Task<IActionResult> UpdateThreshold([FromBody] UpdateThresholdDto dto)
        {
            var success = await _inventoryService.UpdateMinThresholdAsync(dto);
            if (!success) return NotFound("Không tìm thấy thông tin tồn kho cho sách này.");
            return Ok(new { message = "Cập nhật ngưỡng tồn kho tối thiểu thành công." });
        }
    }
}
