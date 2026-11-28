using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckoutController : ControllerBase
    {
        private readonly ICheckoutService _checkoutService;

        public CheckoutController(ICheckoutService checkoutService)
        {
            _checkoutService = checkoutService;
        }

        private int GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("UserId");
            if (!int.TryParse(value, out var userId))
                throw new UnauthorizedAccessException("Không xác định được người dùng.");
            return userId;
        }

        [HttpPost]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Member")]
        public async Task<IActionResult> Checkout([FromBody] CreateCheckoutRequest request)
        {
            try
            {
                var id = User.FindFirst("UserId")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(id, out var currentUserId)) return Unauthorized();
                request.UserId = currentUserId;
                var response = await _checkoutService.ProcessCheckoutAsync(request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi trong quá trình xử lý đơn hàng.", error = ex.Message });
            }
        }

        [HttpPost("{orderId}/momo-payment")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CreateMoMoPayment(int orderId)
        {

            try
            {
                var payUrl = await _checkoutService.CreatePaymentUrlAsync(orderId, GetCurrentUserId());
                return Ok(new { payUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{orderId}/vn-payment")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CreateVnPayPayment(int orderId)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            if (ipAddress == "::1" || string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = "127.0.0.1";
            }
            try
            {
                var payUrl = await _checkoutService.CreateVnPayUrlAsync(orderId, ipAddress, GetCurrentUserId());
                return Ok(new { payUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{orderId}/sepay-payment")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CreateSePayPayment(int orderId)
        {
            try
            {
                var payUrl = await _checkoutService.CreateSePayUrlAsync(orderId, GetCurrentUserId());
                return Ok(new { payUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("sepay-ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> SePayIpn([FromBody] JsonElement ipnPayload)
        {
            try
            {
                await _checkoutService.HandleSePayIpnAsync(
                    ipnPayload, Request.Headers.Authorization.ToString());
                return Ok(new { success = true, message = "Webhook processed successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("momo-ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> MoMoIpn([FromBody] JsonElement ipnPayload)
        {
            try
            {
                await _checkoutService.HandleMoMoIpnAsync(ipnPayload);
                return Ok(new { resultCode = 0, message = "Received" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { resultCode = 1, message = ex.Message });
            }
        }

        [HttpGet("{orderId}/check-status")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CheckPaymentStatus(int orderId)
        {
            try
            {
                GetMomoResponse response = await _checkoutService.QueryMoMoPaymentStatusAsync(orderId, GetCurrentUserId());
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{orderId}/is-paid")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CheckIsPaid(int orderId)
        {
            try
            {
                var isPaid = await _checkoutService.IsOrderOnlinePaidAsync(orderId, GetCurrentUserId());
                return Ok(new { isPaid });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống.", details = ex.Message });
            }
        }
    }
}
