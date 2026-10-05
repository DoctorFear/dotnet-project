using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Application.DTOs;
using AncientBook.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            try
            {
                var result = await _orderService.CancelOrder(id);
                if (result)
                {
                    return Ok(new { message = $"Đã gửi yêu cầu hủy hoặc hủy thành công đơn hàng #{id}." });
                }
                return BadRequest(new { message = "Không thể hủy đơn hàng." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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

        [HttpPost("{id}/request-refund")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> RequestRefund(int id)
        {
            try
            {
                var result = await _orderService.RequestRefundOrder(id);
                if (result)
                {
                    return Ok(new { message = $"Đã gửi yêu cầu hoàn trả thành công cho đơn hàng #{id}." });
                }
                return BadRequest(new { message = "Không thể yêu cầu hoàn trả đơn hàng này." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Dữ liệu yêu cầu không hợp lệ." });
            }

            try
            {
                string adminName = User.Identity?.Name ?? "SystemAdmin";

                var result = await _orderService.UpdateOrderStatusAsync(id, request.NewStatus, adminName);
                if (result)
                {
                    return Ok(new { message = $"Cập nhật trạng thái đơn hàng #{id} thành {request.NewStatus} thành công." });
                }
                return BadRequest(new { message = "Cập nhật trạng thái thất bại." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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

        [HttpPut("{id}/approve-refund")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveReturnOrderAsync(int id)
        {
            try
            {
                string adminName = User.Identity?.Name ?? "SystemAdmin";

                var result = await _orderService.ApproveReturnOrderAsync(id, adminName);
                
                if (result)
                {
                    return Ok(new { message = $"Đã chấp nhận yêu cầu hoàn trả thành công cho đơn hàng #{id}." });
                }
                return BadRequest(new { message = "Không thể chấp nhận yêu cầu hoàn trả đơn hàng này." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
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

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetPagedOrders([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] int? userId = null, [FromQuery] OrderStatus? status = null, [FromQuery] string? searchKeyword = null)
        
        {
            try
            {
                var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? 
                                   User.FindFirst("sub")?.Value;
                var userRoleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int currentUserId))
                {
                    return Unauthorized(new { message = "Không thể xác thực thông tin người dùng." });
                }

                bool isAdmin = userRoleClaim == "Admin";

                if (!isAdmin)
                {
                    userId = currentUserId;
                    searchKeyword = null;
                }
                
                var query = new GetOrdersQuery
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    UserId = userId,
                    Status = status
                };

                var result = await _orderService.GetPagedOrdersAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }
    }
}