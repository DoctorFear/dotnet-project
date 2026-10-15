using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // Lấy tất cả danh mục (Dành cho Dropdown Storefront / Menu)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _categoryService.GetAllCategoriesAsync();
            return Ok(result);
        }

        // Lấy danh sách thể loại có phân trang và tìm kiếm.
        [HttpGet("paged")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> GetPaged([FromQuery] string? searchTerm, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _categoryService.GetPagedCategoriesAsync(searchTerm, pageNumber, pageSize);
            return Ok(result);
        }

        // Xem chi tiết danh mục theo Id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _categoryService.GetCategoryByIdAsync(id);
            if (result == null) return NotFound(new { message = "Không tìm thấy danh mục!" });
            return Ok(result);
        }

        // Thêm thể loại mới.
        [HttpPost]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> Create([FromBody] SaveCategoryDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var result = await _categoryService.CreateCategoryAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Cập nhật thể loại.
        [HttpPut("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> Update(int id, [FromBody] SaveCategoryDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var result = await _categoryService.UpdateCategoryAsync(id, dto, userId);
                if (result == null) return NotFound(new { message = "Không tìm thấy danh mục để cập nhật!" });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Xóa thể loại sau khi kiểm tra các liên kết.
        [HttpDelete("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var success = await _categoryService.DeleteCategoryAsync(id, userId);
                if (!success) return NotFound(new { message = "Không tìm thấy danh mục!" });
                return Ok(new { message = "Xóa danh mục thể loại thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
