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
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly IFileStorageService _storage;

        public ReviewsController(IReviewService reviewService, IFileStorageService storage)
        {
            _reviewService = reviewService;
            _storage = storage;
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

        [HttpGet("eligible-orders")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetEligibleOrders(int pageNumber = 1, int pageSize = 10)
        {
            return Ok(await _reviewService.GetEligibleOrdersAsync(GetCurrentUserId(), pageNumber, pageSize));
        }

        [HttpPost("images")]
        [Authorize(Roles = "Member")]
        [RequestSizeLimit(6 * 1024 * 1024)]
        public async Task<IActionResult> UploadReviewImage(IFormFile file)
        {
            if (file == null || file.Length == 0 || file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB." });
            var types = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                { [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".png"] = "image/png", [".webp"] = "image/webp" };
            if (!types.TryGetValue(Path.GetExtension(file.FileName), out var type) || file.ContentType != type)
                return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP." });
            try { return Ok(new { fileUrl = await _storage.SaveFileAsync(file, $"review_images/user_{GetCurrentUserId()}") }); }
            catch (Exception) { return StatusCode(502, new { message = "Chưa thể tải ảnh lên. Vui lòng thử lại." }); }
        }

        // UC21: Tạo đánh giá
        [HttpPost]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
        {
            try
            {
                if (request == null || request.Rating < 1 || request.Rating > 5)
                {
                    return BadRequest(new { message = "Vui lòng chọn số sao (1-5) và nhập nội dung bình luận!" });
                }

                var userId = GetCurrentUserId();
                var result = await _reviewService.CreateReviewAsync(userId, request);

                return Ok(new
                {
                    message = $"Gửi đánh giá thành công! Bạn được cộng thêm điểm thưởng.",
                    data = result
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
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // UC21: Sửa đánh giá
        [HttpPut("{reviewId}")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> UpdateReview(int reviewId, [FromBody] UpdateReviewRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { message = "Dữ liệu không hợp lệ." });
                }
                request.ReviewId = reviewId;

                var userId = GetCurrentUserId();
                var result = await _reviewService.UpdateReviewAsync(userId, request);
                return Ok(new { message = "Cập nhật đánh giá thành công.", data = result });
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

        // UC21: Xóa đánh giá
        [HttpDelete("{reviewId}")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> DeleteReview(int reviewId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.DeleteReviewAsync(userId, reviewId);

                if (result)
                {
                    return Ok(new { message = "Xóa đánh giá thành công." });
                }
                return BadRequest(new { message = "Không thể xóa đánh giá." });
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

        // Public: Lấy danh sách đánh giá của sách
        [HttpGet("book/{bookId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByBook(int bookId, [FromQuery] BookReviewQuery query)
        {
            try
            {
                var result = await _reviewService.GetByBookAsync(bookId, query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // Lấy tổng hợp đánh giá (số sao trung bình)
        [HttpGet("book/{bookId}/summary")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBookSummary(int bookId)
        {
            try
            {
                var result = await _reviewService.GetBookSummaryAsync(bookId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }

        // Lấy đánh giá của tôi
        [HttpGet("my-reviews")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMyReviews([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _reviewService.GetMyReviewsAsync(userId, pageNumber, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống.", details = ex.Message });
            }
        }
    }
}
