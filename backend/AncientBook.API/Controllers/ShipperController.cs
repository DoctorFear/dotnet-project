using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippersController : ControllerBase
    {
        private readonly IShipperService _shipperService;

        public ShippersController(IShipperService shipperService)
        {
            _shipperService = shipperService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllShippers()
        {
            var result = await _shipperService.GetAllShippersAsync();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateShipper([FromBody] ShipperDto dto)
        {
            var success = await _shipperService.CreateShipperAsync(dto);
            if (!success) return BadRequest("Không thể tạo thông tin Shipper.");
            return Ok(new { message = "Tạo thông tin Shipper thành công." });
        }

        [HttpGet("{shipperId}/orders")]
        public async Task<IActionResult> GetOrdersByShipper(int shipperId)
        {
            var result = await _shipperService.GetOrdersByShipperAsync(shipperId);
            return Ok(result);
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignOrder([FromBody] AssignShipperDto dto)
        {
            try
            {
                var success = await _shipperService.AssignOrderToShipperAsync(dto);
                if (!success) return NotFound("Không tìm thấy Đơn hàng hoặc Shipper.");
                return Ok(new { message = "Phân công đơn hàng cho Shipper thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("unassign/{orderId}")]
        public async Task<IActionResult> UnassignOrder(int orderId)
        {
            var success = await _shipperService.UnassignOrderAsync(orderId);
            if (!success) return NotFound("Không tìm thấy đơn hàng.");
            return Ok(new { message = "Đã hủy phân công đơn hàng." });
        }
    }
}
