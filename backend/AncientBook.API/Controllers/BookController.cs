using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Infrastructure.Storage;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly IBookImageService _images;

        public BookController(IBookService bookService, IBookImageService images)
        {
            _bookService = bookService;
            _images = images;
        }

        // Tra cứu, lọc nâng cao và phân trang danh sách sách.
        [HttpGet]
        public async Task<IActionResult> GetFiltered([FromQuery] BookFilterRequestDto filter)
        {
            var result = await _bookService.GetFilteredBooksAsync(filter);
            return Ok(result);
        }

        [HttpGet("publication-years")]
        public async Task<IActionResult> GetPublicationYears() => Ok(await _bookService.GetPublicationYearsAsync());

        // Xem thông tin chi tiết sách và thư viện ảnh.
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _bookService.GetBookDetailByIdAsync(id);
            if (result == null) return NotFound(new { message = "Không tìm thấy sản phẩm sách!" });
            return Ok(result);
        }

        // Upload ảnh bìa/gallery; ấn bản PDF/EPUB dùng API EbookEditions.
        [HttpPost("upload-file")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> UploadFile(IFormFile file, [FromQuery] string folder = "books")
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Vui lòng chọn tệp tin cần tải lên!" });

                var fileUrl = await _images.UploadAsync(file);
                return Ok(new { fileUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Thêm đầu sách mới.
        [HttpPost]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> Create([FromBody] SaveBookDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var result = await _bookService.CreateBookAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Cập nhật thông tin sách, thể loại và ảnh.
        [HttpPut("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> Update(int id, [FromBody] SaveBookDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var result = await _bookService.UpdateBookAsync(id, dto, userId);
                if (result == null) return NotFound(new { message = "Không tìm thấy sách để cập nhật!" });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Đổi nhanh trạng thái kinh doanh của sách.
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var success = await _bookService.UpdateBookStatusAsync(id, status, userId);
                if (!success) return NotFound(new { message = "Cập nhật trạng thái không thành công!" });
                return Ok(new { message = "Cập nhật trạng thái sách thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Xóa sách hoặc ngừng kinh doanh nếu đã có đơn hàng.
        [HttpDelete("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                var success = await _bookService.DeleteBookAsync(id, userId);
                if (!success) return NotFound(new { message = "Không tìm thấy sách!" });
                return Ok(new { message = "Xóa sách thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
