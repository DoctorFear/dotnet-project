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
    [Authorize]
    public class FulfillmentController : ControllerBase
    {
        private readonly IFulfillmentService _fulfillmentService;

        [HttpPost("orders/{orderId}/packing-issue")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> ReportPackingIssue(int orderId, [FromBody] PackingIssueRequest request)
        {
            try
            {
                await _fulfillmentService.ReportPackingIssueAsync(orderId, User.Identity?.Name ?? "SystemStaff", request.Reason);
                return Ok(new { message = "Đã báo sự cố kho. Trạng thái đơn được giữ nguyên." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        public FulfillmentController(IFulfillmentService fulfillmentService)
        {
            _fulfillmentService = fulfillmentService;
        }

        // UC18: Lấy danh sách đơn chờ đóng gói (Confirmed)
        [HttpGet("pending-orders")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> GetPendingOrders([FromQuery] FulfillmentPendingQuery query)
        {
            try
            {
                var result = await _fulfillmentService.GetPendingOrdersAsync(query);
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

        // UC18: Chi tiết đơn để đóng gói
        [HttpGet("orders/{orderId}")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> GetOrderDetail(int orderId)
        {
            try
            {
                var result = await _fulfillmentService.GetOrderDetailAsync(orderId);
                return Ok(result);
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

        // UC18: Xác nhận đóng gói xong
        [HttpPost("orders/{orderId}/confirm-packing")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> ConfirmPacking(int orderId)
        {
            try
            {
                string staffUsername = User.Identity?.Name ?? "SystemStaff";
                var result = await _fulfillmentService.ConfirmPackingAsync(orderId, staffUsername);

                if (result)
                {
                    return Ok(new { message = $"Đã hoàn tất đóng gói đơn hàng #{orderId}. Đơn chuyển sang danh sách chờ phân công giao hàng!" });
                }
                return BadRequest(new { message = "Không thể xác nhận đóng gói." });
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
    }
}
