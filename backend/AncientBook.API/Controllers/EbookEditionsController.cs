using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Application.Common.Models;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using AncientBook.Infrastructure.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

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
        private readonly IGeminiEmbeddingService _geminiService;
        private readonly ApplicationDbContext _context;

        public EbookEditionsController(
            IEbookEditionRepository editionRepository,
            IFileStorageService fileStorageService,
            IDocumentExtractor documentExtractor,
            IEbookPublishService publishService,
            IRagSearchService ragSearchService,
            IGeminiEmbeddingService geminiService,
            ApplicationDbContext context)
        {
            _editionRepository = editionRepository;
            _fileStorageService = fileStorageService;
            _documentExtractor = documentExtractor;
            _publishService = publishService;
            _ragSearchService = ragSearchService;
            _geminiService = geminiService;
            _context = context;
        }

        /// <summary>
        /// Bước 1: Tải tệp PDF/EPUB lên server để trích xuất metadata kỹ thuật và lưu bản nháp
        /// </summary>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(104_857_600)]
        public async Task<IActionResult> UploadEditionFile(
            [FromForm] UploadEditionRequest request,
            [FromServices] ApplicationDbContext dbContext,
            CancellationToken ct)
        {
            var file = request.File;
            int bookId = request.BookId;

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn tệp sách hợp lệ." });

            var bookExists = await dbContext.Books.AnyAsync(b => b.Id == bookId, ct);
            if (!bookExists)
            {
                return BadRequest(new
                {
                    message = $"Không tìm thấy sách với BookId = {bookId}. Vui lòng chọn một mã sách hợp lệ."
                });
            }

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

            var suggestedPresetType = format == EbookFormat.Epub
                ? EbookPresetType.EpubStandard
                : EbookPresetType.PdfStandard;

            var edition = new EbookEdition
            {
                BookId = bookId,
                FileTitle = file.FileName,
                Format = format,
                DropboxPath = dropboxPath,
                FileSizeBytes = fileSize,
                TotalPages = totalPages,
                Status = EditionPublishStatus.Draft,
                PresetType = suggestedPresetType
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
                SuggestedPresetType = suggestedPresetType.ToString()
            };

            return Ok(response);
        }

        /// <summary>
        /// Bước 2: Lưu nháp cấu hình đã chọn (PresetType) khi chưa muốn công khai ngay
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

            edition.PresetType = request.PresetType;
            edition.Status = EditionPublishStatus.Draft;

            _editionRepository.Update(edition);
            await _editionRepository.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Lưu bản nháp thành công.",
                EditionId = edition.Id,
                PresetType = edition.PresetType.ToString()
            });
        }

        /// <summary>
        /// Bước 3: Xuất bản ấn bản (Bóc tách văn bản, nạp Vector RAG và mở bán sách)
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

            bool isSuccess = await _publishService.PublishEditionAsync(editionId, request.PresetType, ct);

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
                PresetType = request.PresetType.ToString(),
                Status = EditionPublishStatus.Published.ToString()
            });
        }

        /// <summary>
        /// Hỏi đáp AI Copilot dựa trên RAG + Bôi đen (SelectedText) + Trang hiện tại (CurrentPage)
        /// </summary>
        [HttpPost("{editionId}/ask-copilot")]
        [ProducesResponseType(typeof(CopilotQueryResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AskCopilot(
            [FromRoute] int editionId,
            [FromBody] CopilotQueryRequest request,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
            {
                return BadRequest(new { message = "Câu hỏi không được để trống." });
            }

            // 1. Tầng RETRIEVAL: Tìm kiếm các chunk liên quan nhất
            string searchQuery = string.IsNullOrWhiteSpace(request.SelectedText)
                ? request.Question
                : $"{request.Question} {request.SelectedText}";

            var relevantChunks = await _ragSearchService.SearchRelevantChunksAsync(editionId, searchQuery, ct);

            var citationTexts = relevantChunks
                .Select(c => $"[Trang {c.PageNumber}]: {c.ChunkContent}")
                .ToList();

            // 2. Tầng GENERATION: Gọi Gemini tổng hợp câu trả lời
            string aiAnswer = await _geminiService.GenerateCopilotAnswerAsync(
                request.Question,
                request.SelectedText,
                request.CurrentPage,
                citationTexts,
                ct);

            // 3. Tầng PERSISTENCE: Lưu vào lịch sử CopilotChatHistory
            int? currentUserId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var parsedId))
            {
                currentUserId = parsedId;
            }

            var historyRecord = new CopilotChatHistory
            {
                EditionId = editionId,
                UserId = currentUserId,
                CurrentPage = request.CurrentPage,
                SelectedText = request.SelectedText,
                Question = request.Question,
                Answer = aiAnswer,
                CreatedAt = DateTime.UtcNow
            };

            _context.CopilotChatHistories.Add(historyRecord);
            await _context.SaveChangesAsync(ct);

            // 4. Trả kết quả về cho Frontend
            var response = new CopilotQueryResponse
            {
                Question = request.Question,
                Answer = aiAnswer,
                TotalMatches = relevantChunks.Count,
                Citations = relevantChunks.Select(c => new BookEmbeddingCitationDto
                {
                    PageNumber = c.PageNumber,
                    ChunkIndex = c.ChunkIndex,
                    ChunkContent = c.ChunkContent
                }).ToList()
            };

            return Ok(response);
        }

        /// <summary>
        /// Lấy lịch sử trò chuyện với AI Copilot cho ấn bản sách này
        /// </summary>
        [HttpGet("{editionId}/copilot-history")]
        [ProducesResponseType(typeof(List<CopilotHistoryItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCopilotHistory(
            [FromRoute] int editionId,
            CancellationToken ct)
        {
            int? currentUserId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var parsedId))
            {
                currentUserId = parsedId;
            }

            var query = _context.CopilotChatHistories
                .Where(h => h.EditionId == editionId);

            if (currentUserId.HasValue)
            {
                query = query.Where(h => h.UserId == currentUserId.Value);
            }

            var histories = await query
                .OrderBy(h => h.CreatedAt)
                .Select(h => new CopilotHistoryItemDto
                {
                    Id = h.Id,
                    CurrentPage = h.CurrentPage,
                    SelectedText = h.SelectedText,
                    Question = h.Question,
                    Answer = h.Answer,
                    CreatedAt = h.CreatedAt
                })
                .ToListAsync(ct);

            return Ok(histories);
        }
    }

    // =========================================================================
    // DTOs CHO TÍNH NĂNG AI COPILOT
    // =========================================================================
    public class CopilotQueryResponse
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public int TotalMatches { get; set; }
        public List<BookEmbeddingCitationDto> Citations { get; set; } = new();
    }

    public class BookEmbeddingCitationDto
    {
        public int? PageNumber { get; set; }
        public int ChunkIndex { get; set; }
        public string ChunkContent { get; set; } = string.Empty;
    }

    public class CopilotHistoryItemDto
    {
        public int Id { get; set; }
        public int? CurrentPage { get; set; }
        public string? SelectedText { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}