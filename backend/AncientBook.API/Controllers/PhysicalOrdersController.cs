using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhysicalOrdersController : ControllerBase
    {
        private readonly IPhysicalOrderService _physicalOrderService;

        public PhysicalOrdersController(IPhysicalOrderService physicalOrderService)
        {
            _physicalOrderService = physicalOrderService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPhysicalOrders([FromQuery] string? status = null, [FromQuery] string? searchKeyword = null)
        {
            var result = await _physicalOrderService.GetPhysicalOrdersAsync(status, searchKeyword);
            return Ok(result);
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPagedPhysicalOrders(
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? searchKeyword = null)
        {
            var result = await _physicalOrderService.GetPagedPhysicalOrdersAsync(pageIndex, pageSize, status, searchKeyword);
            return Ok(result);
        }

        [HttpGet("{orderId}/tracking")]
        public async Task<IActionResult> GetOrderTracking(int orderId)
        {
            var tracking = await _physicalOrderService.GetOrderTrackingAsync(orderId);
            if (tracking == null)
            {
                return NotFound(new { message = $"Không tìm thấy vận đơn vật lý #{orderId}." });
            }
            return Ok(tracking);
        }

        [HttpPut("{orderId}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] UpdatePhysicalOrderStatusDto dto)
        {
            try
            {
                var success = await _physicalOrderService.UpdateOrderStatusAsync(orderId, dto.NewStatus);
                if (!success)
                {
                    return NotFound(new { message = $"Không tìm thấy đơn hàng #{orderId}." });
                }
                return Ok(new { message = $"Cập nhật trạng thái đơn hàng #{orderId} sang '{dto.NewStatus}' thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
