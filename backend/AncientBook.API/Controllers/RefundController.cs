using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RefundController : ControllerBase
    {
        private readonly IRefundService _refundService;

        public RefundController(IRefundService refundService)
        {
            _refundService = refundService;
        }

        [HttpPost("request")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> RequestRefund([FromForm] RefundRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "Không thể xác thực thông tin người dùng." });

                if (request.Images != null && request.Images.Count > 6)
                    return BadRequest(new { message = "Chỉ được phép tải lên tối đa 6 hình ảnh." });

                var result = await _refundService.SubmitRefundRequestAsync(request, userId);
                
                if (result) return Ok(new { success = true, message = "Gửi yêu cầu hoàn trả thành công!" });
                
                return BadRequest(new { success = false, message = "Không thể gửi yêu cầu hoàn trả." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetRefundDetails(int orderId)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
                var userRoleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Không thể xác thực thông tin người dùng." });
                }

                var result = await _refundService.GetRefundByOrderIdAsync(orderId, userId, userRoleClaim);
                
                if (result == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin hoàn trả cho đơn hàng này." });
                }
                
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> GetPagedRefunds([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] int? userId = null, [FromQuery] string? searchKeyword = null)
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

                bool isAdmin = userRoleClaim == "Admin" || userRoleClaim == "Staff";

                if (!isAdmin)
                {
                    userId = currentUserId;
                    searchKeyword = null; 
                }

                var query = new GetRefundsQuery
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    UserId = userId,
                    SearchKeyword = searchKeyword
                };

                var result = await _refundService.GetPagedRefundsAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }
    }
}