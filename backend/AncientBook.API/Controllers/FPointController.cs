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

        // UC22: Áp dụng điểm khi checkout
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyPoints([FromBody] UseFPointRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _fpointService.ValidateAndCalculatePointsAsync(userId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
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
    }
}