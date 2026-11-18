using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierService _supplierService;

        public SuppliersController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSuppliers([FromQuery] string? searchKeyword = null, [FromQuery] string? status = null)
        {
            var result = await _supplierService.GetAllSuppliersAsync(searchKeyword, status);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSupplierById(int id)
        {
            var supplier = await _supplierService.GetSupplierByIdAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = "Không tìm thấy nhà cung cấp." });
            }
            return Ok(supplier);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
        {
            try
            {
                var actor = User?.Identity?.Name ?? "Staff";
                var created = await _supplierService.CreateSupplierAsync(dto, actor);
                return CreatedAtAction(nameof(GetSupplierById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] UpdateSupplierDto dto)
        {
            try
            {
                var actor = User?.Identity?.Name ?? "Staff";
                var success = await _supplierService.UpdateSupplierAsync(id, dto, actor);
                if (!success)
                {
                    return NotFound(new { message = "Không tìm thấy nhà cung cấp." });
                }
                return Ok(new { message = "Cập nhật thông tin nhà cung cấp thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateSupplierStatus(int id, [FromBody] UpdateSupplierStatusDto dto)
        {
            try
            {
                var actor = User?.Identity?.Name ?? "Staff";
                var success = await _supplierService.UpdateSupplierStatusAsync(id, dto.Status, actor);
                if (!success)
                {
                    return NotFound(new { message = "Không tìm thấy nhà cung cấp." });
                }
                return Ok(new { message = $"Đã chuyển trạng thái hợp tác của nhà cung cấp sang '{dto.Status}'." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
