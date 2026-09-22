using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using System.Text.Json;

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

        [HttpPost]
        public async Task<IActionResult> Checkout([FromBody] CreateCheckoutRequest request)
        {
            try
            {
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi trong quá trình xử lý đơn hàng.", error = ex.Message });
            }
        }

        [HttpPost("{orderId}/momo-payment")]
        public async Task<IActionResult> CreateMoMoPayment(int orderId)
        {

            try
            {
                var payUrl = await _checkoutService.CreatePaymentUrlAsync(orderId);
                return Ok(new { payUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("momo-ipn")]
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
        public async Task<IActionResult> CheckPaymentStatus(int orderId)
        {
            try
            {
                GetMomoResponse response = await _checkoutService.QueryMoMoPaymentStatusAsync(orderId);
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
    }
}