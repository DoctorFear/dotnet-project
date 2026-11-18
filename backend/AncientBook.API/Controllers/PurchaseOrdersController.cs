using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly IPurchaseOrderService _purchaseOrderService;

        public PurchaseOrdersController(IPurchaseOrderService purchaseOrderService)
        {
            _purchaseOrderService = purchaseOrderService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPurchaseOrders(
            [FromQuery] string? status = null,
            [FromQuery] int? supplierId = null,
            [FromQuery] string? searchKeyword = null)
        {
            var result = await _purchaseOrderService.GetAllPurchaseOrdersAsync(status, supplierId, searchKeyword);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPurchaseOrderById(int id)
        {
            var po = await _purchaseOrderService.GetPurchaseOrderByIdAsync(id);
            if (po == null)
            {
                return NotFound(new { message = "Không tìm thấy phiếu nhập kho." });
            }
            return Ok(po);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto)
        {
            try
            {
                var actor = User?.Identity?.Name ?? "WarehouseStaff";
                var created = await _purchaseOrderService.CreatePurchaseOrderAsync(dto, actor);
                return CreatedAtAction(nameof(GetPurchaseOrderById), new { id = created.Id }, created);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchaseOrder(int id, [FromBody] UpdatePurchaseOrderDto dto)
        {
            try
            {
                var actor = User?.Identity?.Name ?? "WarehouseStaff";
                var success = await _purchaseOrderService.UpdatePurchaseOrderAsync(id, dto, actor);
                if (!success)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu nhập kho." });
                }
                return Ok(new { message = "Cập nhật phiếu nhập kho thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApprovePurchaseOrder(int id, [FromBody] ApprovePurchaseOrderDto? dto = null)
        {
            try
            {
                var approver = User?.Identity?.Name ?? "WarehouseAdmin";
                var approved = await _purchaseOrderService.ApprovePurchaseOrderAsync(id, dto, approver);
                return Ok(new
                {
                    message = $"Duyệt phiếu nhập kho {approved.Code} và cập nhật tồn kho thành công.",
                    data = approved
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelPurchaseOrder(int id, [FromBody] CancelPurchaseOrderDto dto)
        {
            try
            {
                var actor = User?.Identity?.Name ?? "WarehouseStaff";
                var success = await _purchaseOrderService.CancelPurchaseOrderAsync(id, dto.CancelReason, actor);
                if (!success)
                {
                    return NotFound(new { message = "Không tìm thấy phiếu nhập kho." });
                }
                return Ok(new { message = "Đã hủy phiếu nhập kho." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
