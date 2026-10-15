using System.Threading;
using System.Threading.Tasks;
using AncientBook.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/EbookEditions/{editionId:int}/tts")]
    public class EbookTtsController : ControllerBase
    {
        private readonly IEbookTtsService _ttsService;

        public EbookTtsController(IEbookTtsService ttsService)
        {
            _ttsService = ttsService;
        }

        /// <summary>
        /// Nhân viên kích hoạt tiến trình tạo giọng đọc AI (Hỗ trợ sinh theo khoảng trang để chống timeout)
        /// </summary>
        [HttpPost("generate")]
        [Authorize(Roles = "Staff")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GenerateTts(
            [FromRoute] int editionId,
            [FromQuery] string language = "vi",
            [FromQuery] int? fromPage = null,
            [FromQuery] int? toPage = null,
            CancellationToken ct = default)
        {
            if (fromPage.HasValue && toPage.HasValue && fromPage > toPage)
            {
                return BadRequest(new { message = "Trang bắt đầu (fromPage) không được lớn hơn trang kết thúc (toPage)." });
            }

            try
            {
                var result = await _ttsService.GenerateTtsAsync(editionId, language, fromPage, toPage, ct);
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
        }

        /// <summary>
        /// Độc giả lấy danh sách các đoạn âm thanh MP3 kèm text hiển thị theo từng trang sách
        /// </summary>
        [HttpGet("pages/{pageNumber:int}/segments")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPageSegments(
            [FromRoute] int editionId,
            [FromRoute] int pageNumber,
            CancellationToken ct = default)
        {
            var segments = await _ttsService.GetPageSegmentsAsync(editionId, pageNumber, ct);
            return Ok(segments);
        }
    }
}   