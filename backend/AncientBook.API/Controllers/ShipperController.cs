using System;
using System.Threading.Tasks;
using System.Security.Claims;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Staff,Admin")]
    public class ShippersController : ControllerBase
    {
        private readonly IShipperService _shipperService;

        public ShippersController(IShipperService shipperService)
        {
            _shipperService = shipperService;
        }

        private int? CurrentUserId() => int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("UserId"),
            out var userId) ? userId : null;

        [HttpGet]
        public async Task<IActionResult> GetAllShippers([FromQuery] string? status = null, [FromQuery] string? area = null)
        {
            var result = await _shipperService.GetAllShippersAsync(status, area);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetShipperById(int id)
        {
            var shipper = await _shipperService.GetShipperByIdAsync(id);
            if (shipper == null) return NotFound(new { message = "Không tìm thấy thông tin Shipper." });
            return Ok(shipper);
        }

        [HttpPost]
        public async Task<IActionResult> CreateShipper([FromBody] ShipperDto dto)
        {
            var success = await _shipperService.CreateShipperAsync(dto);
            if (!success) return BadRequest(new { message = "Không thể tạo thông tin Shipper. Vui lòng kiểm tra tên và số điện thoại." });
            return Ok(new { message = "Tạo thông tin Shipper thành công." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateShipper(int id, [FromBody] ShipperDto dto)
        {
            var success = await _shipperService.UpdateShipperAsync(id, dto);
            if (!success) return NotFound(new { message = "Không tìm thấy thông tin Shipper." });
            return Ok(new { message = "Cập nhật thông tin Shipper thành công." });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateShipperStatus(int id, [FromBody] UpdateShipperStatusDto dto)
        {
            var success = await _shipperService.UpdateShipperStatusAsync(id, dto.Status);
            if (!success) return NotFound(new { message = "Không tìm thấy thông tin Shipper hoặc trạng thái không hợp lệ." });
            return Ok(new { message = "Cập nhật trạng thái Shipper thành công." });
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
                var success = await _shipperService.AssignOrderToShipperAsync(dto, CurrentUserId());
                if (!success) return NotFound(new { message = "Không tìm thấy Đơn hàng hoặc Shipper." });
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
            try
            {
                var success = await _shipperService.UnassignOrderAsync(orderId, CurrentUserId());
                if (!success) return NotFound(new { message = "Không tìm thấy đơn hàng." });
                return Ok(new { message = "Đã hủy phân công đơn hàng." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
