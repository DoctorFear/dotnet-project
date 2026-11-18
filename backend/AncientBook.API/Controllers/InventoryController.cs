using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;
using Microsoft.AspNetCore.Mvc;

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

        [HttpGet("stocks")]
        public async Task<IActionResult> GetAllStocks()
        {
            var result = await _inventoryService.GetAllInventoryStocksAsync();
            return Ok(result);
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
            if (!success) return NotFound(new { message = "Không tìm thấy cảnh báo tồn kho." });
            return Ok(new { message = "Cảnh báo đã được đánh dấu xử lý." });
        }

        [HttpPut("threshold")]
        public async Task<IActionResult> UpdateThreshold([FromBody] UpdateThresholdDto dto)
        {
            try
            {
                var success = await _inventoryService.UpdateMinThresholdAsync(dto);
                if (!success) return NotFound(new { message = "Không tìm thấy thông tin tồn kho cho sách này." });
                return Ok(new { message = "Cập nhật ngưỡng tồn kho tối thiểu thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("movements")]
        public async Task<IActionResult> GetStockMovements([FromQuery] int? bookId = null, [FromQuery] string? movementType = null)
        {
            var result = await _inventoryService.GetStockMovementsAsync(bookId, movementType);
            return Ok(result);
        }
    }
}
