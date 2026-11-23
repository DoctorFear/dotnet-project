using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Enums;
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
        private readonly IEbookEditionRepository _editionRepository;
        private readonly IAuditLogService _auditLogService;

        public EbookTtsController(
            IEbookTtsService ttsService,
            IEbookEditionRepository editionRepository,
            IAuditLogService auditLogService)
        {
            _ttsService = ttsService;
            _editionRepository = editionRepository;
            _auditLogService = auditLogService;
        }

        private int CurrentUserId
        {
            get
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return int.TryParse(claim, out int id) ? id : 0;
            }
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

            var edition = await _editionRepository.GetByIdAsync(editionId, ct);
            if (edition == null)
            {
                return NotFound(new { message = "Không tìm thấy ấn bản E-Book." });
            }
            if (edition.PresetType != EbookPresetType.EpubStandard)
            {
                return BadRequest(new { message = "Chỉ có ấn bản Nhóm 1 (Văn học - EPUB) mới áp dụng tính năng tạo giọng đọc số TTS." });
            }

            try
            {
                var result = await _ttsService.GenerateTtsAsync(editionId, language, fromPage, toPage, ct);

                // Ghi nhật ký Audit Log
                await _auditLogService.LogAsync(
                    action: "GENERATE_TTS_EBOOK",
                    module: "EbookManagement",
                    entityName: "EbookEdition",
                    recordId: editionId.ToString(),
                    details: $"Kích hoạt tạo giọng đọc số TTS cho ấn bản #{editionId} (Ngôn ngữ: {language}, Từ trang: {fromPage?.ToString() ?? "đầu"}, Đến trang: {toPage?.ToString() ?? "cuối"}, Tổng đoạn tạo: {result.TotalSegmentsGenerated}).",
                    userId: CurrentUserId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString()
                );

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
        /// Độc giả lấy danh sách các đoạn âm thanh MP3 kèm text hiển thị theo từng trang sách (Dành cho Staff và Customer)
        /// </summary>
        [HttpGet("pages/{pageNumber:int}/segments")]
        [Authorize(Roles = "Staff,Member,Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPageSegments(
            [FromRoute] int editionId,
            [FromRoute] int pageNumber,
            CancellationToken ct = default)
        {
            var edition = await _editionRepository.GetByIdAsync(editionId, ct);
            if (edition == null)
            {
                return NotFound(new { message = "Không tìm thấy ấn bản E-Book." });
            }

            var segments = await _ttsService.GetPageSegmentsAsync(editionId, pageNumber, ct);

            // Nếu phân loại là Học thuật (PdfStandard) hoặc Thị giác (ScannedBook), TUYỆT ĐỐI KHÔNG cấp Audio URL cho người đọc
            if (edition.PresetType != EbookPresetType.EpubStandard)
            {
                var textOnlySegments = segments.Select(s => new PageTtsResponseDto
                {
                    Id = s.Id,
                    PageNumber = s.PageNumber,
                    SegmentIndex = s.SegmentIndex,
                    TextContent = s.TextContent,
                    AudioUrlFemale = string.Empty,
                    AudioUrlMale = string.Empty
                }).ToList();
                return Ok(textOnlySegments);
            }

            return Ok(segments);
        }
    }
}   