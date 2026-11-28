using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff,Admin")]
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
        public IActionResult UpdateOrderStatus(int orderId, [FromBody] UpdatePhysicalOrderStatusDto dto)
        {
            return Conflict(new
            {
                message = "Không cập nhật trạng thái qua API chung. Hãy dùng đúng quy trình Xác nhận đơn, Đóng gói hoặc Giao nhận để giữ checklist, COD và Audit Log."
            });
        }
    }
}
