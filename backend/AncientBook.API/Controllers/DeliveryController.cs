using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Shipper")]
    public class DeliveryController : ControllerBase
    {
        private readonly IDeliveryService _deliveryService;

        public DeliveryController(IDeliveryService deliveryService)
        {
            _deliveryService = deliveryService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Không xác định được người dùng.");
            }
            return userId;
        }

        // UC19: Shipper xem danh sách đơn được phân công
        [HttpGet("my-deliveries")]
        public async Task<IActionResult> GetMyDeliveries([FromQuery] DeliveryOrderQuery query)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _deliveryService.GetMyDeliveriesAsync(userId, query);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // UC19: Shipper xem chi tiết đơn
        [HttpGet("my-deliveries/{orderId}")]
        public async Task<IActionResult> GetDeliveryDetail(int orderId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _deliveryService.GetDeliveryDetailAsync(orderId, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // UC19: Shipper cập nhật trạng thái
        [HttpPut("my-deliveries/{orderId}/status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int orderId, [FromBody] UpdateDeliveryStatusRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _deliveryService.UpdateDeliveryStatusAsync(orderId, userId, request);

                if (result)
                {
                    return Ok(new { message = $"Cập nhật trạng thái đơn hàng #{orderId} thành công." });
                }
                return BadRequest(new { message = "Không thể cập nhật trạng thái." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // UC19: Lấy danh sách lý do giao thất bại
        [HttpGet("failure-reasons")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFailureReasons()
        {
            try
            {
                var result = await _deliveryService.GetFailureReasonsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }
    }
}