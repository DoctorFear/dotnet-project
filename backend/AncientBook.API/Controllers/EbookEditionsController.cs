using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Application.Common.Models.Responses;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
public class UploadEditionRequest
{
    [Required(ErrorMessage = "Mã sách không được để trống.")]
    public int BookId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn tệp sách.")]
    public IFormFile File { get; set; } = null!;
}
namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EbookEditionsController : ControllerBase
    {
        private readonly IEbookEditionRepository _editionRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly IDocumentExtractor _documentExtractor;
        private readonly IEbookPublishService _publishService;
        private readonly IRagSearchService _ragSearchService;

        public EbookEditionsController(
            IEbookEditionRepository editionRepository,
            IFileStorageService fileStorageService,
            IDocumentExtractor documentExtractor,
            IEbookPublishService publishService,
            IRagSearchService ragSearchService)
        {
            _editionRepository = editionRepository;
            _fileStorageService = fileStorageService;
            _documentExtractor = documentExtractor;
            _publishService = publishService;
            _ragSearchService = ragSearchService;
        }

        /// <summary>
        /// Bước 1: Nhân viên tải tệp PDF/EPUB lên server để trích xuất metadata kỹ thuật và lưu nháp
        /// </summary>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(104_857_600)] // Hạn mức tối đa 100MB
        [ProducesResponseType(typeof(UploadEditionResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadEditionFile(
            [FromForm] UploadEditionRequest request,
            CancellationToken ct)
        {
            var file = request.File;
            int bookId = request.BookId;

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn tệp sách hợp lệ." });

            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".pdf" && extension != ".epub")
            {
                return BadRequest(new { message = "Định dạng không hỗ trợ. Hệ thống chỉ chấp nhận tệp .pdf hoặc .epub." });
            }

            var format = extension == ".epub" ? EbookFormat.Epub : EbookFormat.Pdf;

            int totalPages;
            long fileSize;
            using (var stream = file.OpenReadStream())
            {
                (totalPages, fileSize) = await _documentExtractor.InspectMetadataAsync(stream, format);
            }

            string dropboxPath = await _fileStorageService.SaveEbookAsync(file, "ebooks");

            int suggestedPresetId = format == EbookFormat.Epub ? 1 : 2;

            var edition = new EbookEdition
            {
                BookId = bookId,
                FileTitle = file.FileName,
                Format = format,
                DropboxPath = dropboxPath,
                FileSizeBytes = fileSize,
                TotalPages = totalPages,
                Status = EditionPublishStatus.Draft,
                PresetId = suggestedPresetId
            };

            await _editionRepository.AddAsync(edition, ct);
            await _editionRepository.SaveChangesAsync(ct);

            var response = new UploadEditionResponse
            {
                EditionId = edition.Id,
                BookId = edition.BookId,
                FileTitle = edition.FileTitle,
                Format = edition.Format.ToString(),
                TotalPages = edition.TotalPages,
                FileSizeBytes = edition.FileSizeBytes,
                Status = edition.Status.ToString(),
                SuggestedPresetId = suggestedPresetId
            };

            return Ok(response);
        }

        /// <summary>
        /// Bước 2: Lưu nháp cấu hình đã chọn (Preset, thông số) khi chưa muốn công khai ngay
        /// </summary>
        [HttpPut("{editionId}/draft")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> SaveDraft(
            [FromRoute] int editionId,
            [FromBody] SaveDraftRequest request,
            CancellationToken ct)
        {
            var edition = await _editionRepository.GetByIdAsync(editionId, ct);
            if (edition == null)
                return NotFound(new { message = "Không tìm thấy ấn bản sách này." });

            edition.PresetId = request.PresetId;
            edition.Status = EditionPublishStatus.Draft;

            _editionRepository.Update(edition);
            await _editionRepository.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Lưu bản nháp thành công.",
                EditionId = edition.Id,
                PresetId = edition.PresetId
            });
        }

        /// <summary>
        /// Bước 3: Xuất bản ấn bản (Kích hoạt pipeline bóc tách, nạp Vector RAG và mở bán sách)
        /// </summary>
        [HttpPost("{editionId}/publish")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PublishEdition(
            [FromRoute] int editionId,
            [FromBody] PublishEditionRequest request,
            CancellationToken ct)
        {
            var edition = await _editionRepository.GetByIdAsync(editionId, ct);
            if (edition == null)
                return NotFound(new { message = "Không tìm thấy ấn bản cần xuất bản." });

            if (edition.Status == EditionPublishStatus.Published)
                return BadRequest(new { message = "Ấn bản này đã được xuất bản trước đó." });

            bool isSuccess = await _publishService.PublishEditionAsync(editionId, request.PresetId, ct);

            if (!isSuccess)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Xuất bản thất bại trong quá trình bóc tách văn bản và nạp tri thức AI."
                });
            }

            return Ok(new
            {
                message = "Xuất bản ấn bản E-Book thành công.",
                EditionId = editionId,
                PresetId = request.PresetId,
                Status = EditionPublishStatus.Published.ToString()
            });
        }

        /// <summary>
        /// Tìm kiếm ngữ nghĩa qua RAG dành cho AI Copilot giải nghĩa ngữ cảnh sách
        /// </summary>
        [HttpPost("{editionId}/ask-copilot")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AskCopilot(
            [FromRoute] int editionId,
            [FromBody] CopilotQueryRequest request,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest(new { message = "Câu hỏi không được để trống." });

            var relevantChunks = await _ragSearchService.SearchRelevantChunksAsync(editionId, request.Question, ct);

            return Ok(new
            {
                Query = request.Question,
                TotalMatches = relevantChunks.Count,
                Citations = relevantChunks
            });
        }
    }
}