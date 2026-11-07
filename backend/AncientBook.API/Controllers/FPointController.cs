using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FPointController : ControllerBase
    {
        private readonly IFPointService _fpointService;

        public FPointController(IFPointService fpointService)
        {
            _fpointService = fpointService;
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

        // UC22: Xem số dư điểm
        [HttpGet("balance")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetBalance()
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _fpointService.GetBalanceAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // UC22: Xem lịch sử biến động điểm
        [HttpGet("history")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetHistory([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _fpointService.GetHistoryAsync(userId, pageNumber, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // UC22: Xem trước mức giảm giá khi dùng điểm, chưa trừ điểm.
        [HttpPost("apply")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> ApplyPoints([FromBody] UseFPointRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _fpointService.ValidateAndCalculatePointsAsync(userId, request);
                return Ok(result);
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

        [HttpGet("orders/{orderId}/points")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetOrderPoints(int orderId)
        {
            try { return Ok(await _fpointService.GetOrderPointsAsync(GetCurrentUserId(), orderId)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        [HttpPost("orders/{orderId}/confirm-receipt")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> ConfirmReceipt(int orderId, [FromBody] ConfirmReceiptRequest request)
        {
            try { return Ok(await _fpointService.ConfirmReceiptAsync(GetCurrentUserId(), orderId, request.AcceptCloseReturnWindow)); }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        // UC22: Lấy danh sách hạng thành viên
        [HttpGet("tiers")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMembershipTiers()
        {
            try
            {
                var result = await _fpointService.GetMembershipTiersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        [HttpPut("tiers/{id}")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> UpdateTier(int id, [FromBody] MembershipTierDto dto)
        {
            try
            {
                var result = await _fpointService.UpdateMembershipTierAsync(id, dto, GetCurrentUserId());
                if (!result)
                    return NotFound(new { message = $"Không tìm thấy hạng thành viên với ID: {id}" });

                return Ok(new { message = "Cập nhật hạng thành viên thành công." });
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
    }
}
