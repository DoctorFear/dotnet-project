using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using AncientBook.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        private readonly IAuditLogService _auditLogService;
        private readonly ISystemSettingRepository _systemSettingRepository;

        public EbookEditionsController(
            IEbookEditionRepository editionRepository,
            IFileStorageService fileStorageService,
            IDocumentExtractor documentExtractor,
            IEbookPublishService publishService,
            IRagSearchService ragSearchService,
            IGeminiEmbeddingService geminiService,
            ApplicationDbContext context,
            IAuditLogService auditLogService,
            ISystemSettingRepository systemSettingRepository)
        {
            _editionRepository = editionRepository;
            _fileStorageService = fileStorageService;
            _documentExtractor = documentExtractor;
            _publishService = publishService;
            _ragSearchService = ragSearchService;
            _geminiService = geminiService;
            _context = context;
            _auditLogService = auditLogService;
            _systemSettingRepository = systemSettingRepository;
        }

        private int CurrentUserId
        {
            get
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return int.TryParse(claim, out int id) ? id : 0;
            }
        }

        private string? ClientIpAddress => HttpContext.Connection.RemoteIpAddress?.ToString();

        /// <summary>
        /// Bước 1 trong quy trình: Tra cứu thông tin ấn bản E-Book mới nhất của một đầu sách (Dành cho Staff và Customer)
        /// </summary>
        [HttpGet("book/{bookId}")]
        [Authorize(Roles = "Staff,Member,Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEditionByBookId([FromRoute] int bookId, CancellationToken ct)
        {
            var edition = await _editionRepository.GetLatestByBookIdAsync(bookId, ct);
            if (edition == null)
            {
                return Ok(new { hasEdition = false, edition = (EbookEditionDetailDto?)null });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Member" && edition.Status != EditionPublishStatus.Published)
            {
                return NotFound(new { message = "Ấn bản E-Book này chưa được phát hành chính thức." });
            }

            int totalEmbeddings = await _context.BookEmbeddings.CountAsync(e => e.EditionId == edition.Id, ct);

            // Cấu hình tính năng:
            // - Nhóm 1 (EpubStandard) & Nhóm 2 (PdfStandard): Hỗ trợ TTS nếu đã bật/sinh audio.
            // - Nhóm 3 (ScannedBook): Tuyệt đối KHÔNG áp dụng TTS vì là ảnh scan nguyên bản.
            bool effectiveTtsEnabled = (edition.PresetType != EbookPresetType.ScannedBook) && edition.IsTtsEnabled;

            var dto = new EbookEditionDetailDto
            {
                Id = edition.Id,
                BookId = edition.BookId,
                BookTitle = edition.Book?.Title ?? string.Empty,
                FileTitle = edition.FileTitle,
                Format = edition.Format.ToString(),
                DropboxPath = edition.DropboxPath,
                FileSizeBytes = edition.FileSizeBytes,
                TotalPages = edition.TotalPages,
                PresetType = edition.PresetType,
                PresetTypeName = edition.PresetType.ToString(),
                Status = edition.Status,
                StatusName = edition.Status.ToString(),
                PublishedAt = edition.PublishedAt,
                IsTtsEnabled = effectiveTtsEnabled,
                TotalEmbeddings = totalEmbeddings,
                CreatedAt = edition.CreatedAt,
                UpdatedAt = edition.UpdatedAt
            };

            return Ok(new { hasEdition = true, edition = dto });
        }

        /// <summary>
        /// Xem thông tin chi tiết một ấn bản điện tử theo Id (Dành cho Staff và Customer)
        /// </summary>
        [HttpGet("{editionId}")]
        [Authorize(Roles = "Staff,Member,Admin")]
        [ProducesResponseType(typeof(EbookEditionDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEditionById([FromRoute] int editionId, CancellationToken ct)
        {
            var edition = await _editionRepository.GetByIdWithBookAsync(editionId, ct);
            if (edition == null)
            {
                return NotFound(new { message = "Không tìm thấy ấn bản E-Book này." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Member" && edition.Status != EditionPublishStatus.Published)
            {
                return NotFound(new { message = "Ấn bản E-Book này chưa được phát hành chính thức." });
            }

            int totalEmbeddings = await _context.BookEmbeddings.CountAsync(e => e.EditionId == edition.Id, ct);

            // Cấu hình tính năng:
            // - Nhóm 1 (EpubStandard) & Nhóm 2 (PdfStandard): Hỗ trợ TTS nếu đã bật/sinh audio.
            // - Nhóm 3 (ScannedBook): Tuyệt đối KHÔNG áp dụng TTS vì là ảnh scan nguyên bản.
            bool effectiveTtsEnabled = (edition.PresetType != EbookPresetType.ScannedBook) && edition.IsTtsEnabled;

            var dto = new EbookEditionDetailDto
            {
                Id = edition.Id,
                BookId = edition.BookId,
                BookTitle = edition.Book?.Title ?? string.Empty,
                FileTitle = edition.FileTitle,
                Format = edition.Format.ToString(),
                DropboxPath = edition.DropboxPath,
                FileSizeBytes = edition.FileSizeBytes,
                TotalPages = edition.TotalPages,
                PresetType = edition.PresetType,
                PresetTypeName = edition.PresetType.ToString(),
                Status = edition.Status,
                StatusName = edition.Status.ToString(),
                PublishedAt = edition.PublishedAt,
                IsTtsEnabled = effectiveTtsEnabled,
                TotalEmbeddings = totalEmbeddings,
                CreatedAt = edition.CreatedAt,
                UpdatedAt = edition.UpdatedAt
            };

            return Ok(dto);
        }

        /// <summary>
        /// Bước 1: Tải tệp PDF/EPUB lên server để trích xuất metadata kỹ thuật và lưu bản nháp
        /// </summary>
        [HttpPost("upload")]
        [Authorize(Roles = "Staff,Admin")]
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

            // Kiểm tra cấu hình hạn mức dung lượng tệp từ SystemSettings (mặc định 100MB)
            long maxSizeBytes = 104_857_600;
            var maxMbSetting = await _systemSettingRepository.GetByKeyAsync("MAX_EBOOK_FILE_SIZE_MB");
            if (maxMbSetting != null && int.TryParse(maxMbSetting.SettingValue, out int maxMb) && maxMb > 0)
            {
                maxSizeBytes = (long)maxMb * 1024 * 1024;
            }

            if (file.Length > maxSizeBytes)
            {
                return BadRequest(new
                {
                    message = $"Dung lượng tệp vượt quá hạn mức cho phép ({maxSizeBytes / (1024 * 1024)}MB). Vui lòng tối ưu hóa dung lượng trước khi tải lại."
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
            try
            {
                using (var stream = file.OpenReadStream())
                {
                    (totalPages, fileSize) = await _documentExtractor.InspectMetadataAsync(stream, format);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = $"Tệp bị lỗi cấu trúc hoặc có mật khẩu khóa mở: {ex.Message}"
                });
            }

            // =========================================================================
            // BƯỚC 1: NẾU ĐÃ CÓ TỆP CŨ CỦA ĐẦU SÁCH NÀY TRÊN DROPBOX, XÓA TỆP CŨ TRƯỚC
            // =========================================================================
            var existingEditions = await dbContext.EbookEditions
                .Where(e => e.BookId == bookId)
                .ToListAsync(ct);

            foreach (var oldEd in existingEditions)
            {
                if (!string.IsNullOrWhiteSpace(oldEd.DropboxPath))
                {
                    try
                    {
                        await _fileStorageService.DeleteFileAsync(oldEd.DropboxPath);
                    }
                    catch (Exception cleanupEx)
                    {
                        Console.WriteLine($"[Dropbox Cleanup Warning]: Không thể xóa tệp cũ {oldEd.DropboxPath}: {cleanupEx.Message}");
                    }
                }

                // Xóa thư mục âm thanh TTS cũ trên Dropbox nếu có
                try
                {
                    await _fileStorageService.DeleteFileAsync($"tts-audio/{oldEd.Id}");
                }
                catch { }

                // Dọn sạch BookEmbeddings, BookTtsSegments, CopilotChatHistories của bản ghi cũ
                var oldEmbeddings = await dbContext.BookEmbeddings.Where(e => e.EditionId == oldEd.Id).ToListAsync(ct);
                if (oldEmbeddings.Any()) dbContext.BookEmbeddings.RemoveRange(oldEmbeddings);

                var oldSegments = await dbContext.BookTtsSegments.Where(s => s.EditionId == oldEd.Id).ToListAsync(ct);
                if (oldSegments.Any()) dbContext.BookTtsSegments.RemoveRange(oldSegments);

                var oldHistories = await dbContext.CopilotChatHistories.Where(h => h.EditionId == oldEd.Id).ToListAsync(ct);
                if (oldHistories.Any()) dbContext.CopilotChatHistories.RemoveRange(oldHistories);
            }

            if (existingEditions.Any())
            {
                dbContext.EbookEditions.RemoveRange(existingEditions);
                await dbContext.SaveChangesAsync(ct);
            }

            // =========================================================================
            // BƯỚC 2: UPLOAD TỆP MỚI LÊN DROPBOX
            // =========================================================================
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

            // Ghi nhật ký hoạt động hệ thống (Audit Log - UC07)
            await _auditLogService.LogAsync(
                action: "UPLOAD_EBOOK",
                module: "EbookManagement",
                entityName: "EbookEdition",
                recordId: edition.Id.ToString(),
                oldValues: null,
                newValues: JsonSerializer.Serialize(new
                {
                    edition.BookId,
                    edition.FileTitle,
                    Format = edition.Format.ToString(),
                    edition.FileSizeBytes,
                    edition.TotalPages,
                    PresetType = edition.PresetType.ToString(),
                    Status = edition.Status.ToString()
                }),
                details: $"Tải lên tệp ấn bản điện tử '{edition.FileTitle}' ({edition.TotalPages} trang, {edition.FileSizeBytes / 1024} KB) cho sách ID {bookId}.",
                userId: CurrentUserId,
                ipAddress: ClientIpAddress
            );

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
        [Authorize(Roles = "Staff,Admin")]
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

            var oldPreset = edition.PresetType.ToString();
            edition.PresetType = request.PresetType;
            if (request.PresetType == EbookPresetType.ScannedBook)
            {
                edition.IsTtsEnabled = false;
            }
            edition.Status = EditionPublishStatus.Draft;

            _editionRepository.Update(edition);
            await _editionRepository.SaveChangesAsync(ct);

            // Ghi nhật ký hoạt động hệ thống (Audit Log - UC07)
            await _auditLogService.LogAsync(
                action: "SAVE_DRAFT_EBOOK",
                module: "EbookManagement",
                entityName: "EbookEdition",
                recordId: edition.Id.ToString(),
                oldValues: JsonSerializer.Serialize(new { PresetType = oldPreset }),
                newValues: JsonSerializer.Serialize(new { PresetType = edition.PresetType.ToString(), Status = "Draft" }),
                details: $"Lưu nháp cấu hình ấn bản #{edition.Id} với nhóm {edition.PresetType}.",
                userId: CurrentUserId,
                ipAddress: ClientIpAddress
            );

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
        [Authorize(Roles = "Staff,Admin")]
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

            var oldStatus = edition.Status.ToString();
            var oldPreset = edition.PresetType.ToString();

            bool isSuccess = await _publishService.PublishEditionAsync(editionId, request.PresetType, ct);

            if (!isSuccess)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Xuất bản thất bại trong quá trình bóc tách văn bản và nạp tri thức AI."
                });
            }

            // Ghi nhật ký hoạt động hệ thống (Audit Log - UC07)
            await _auditLogService.LogAsync(
                action: "PUBLISH_EBOOK",
                module: "EbookManagement",
                entityName: "EbookEdition",
                recordId: editionId.ToString(),
                oldValues: JsonSerializer.Serialize(new { Status = oldStatus, PresetType = oldPreset }),
                newValues: JsonSerializer.Serialize(new { Status = "Published", PresetType = request.PresetType.ToString() }),
                details: $"Xuất bản ấn bản điện tử #{editionId} (Cấu hình: {request.PresetType}) cho sách ID {edition.BookId}.",
                userId: CurrentUserId,
                ipAddress: ClientIpAddress
            );

            return Ok(new
            {
                message = "Xuất bản ấn bản E-Book thành công.",
                EditionId = editionId,
                PresetType = request.PresetType.ToString(),
                Status = EditionPublishStatus.Published.ToString()
            });
        }

        /// <summary>
        /// Gỡ bỏ/Xóa ấn bản E-Book khỏi sách (Xóa file Dropbox, embeddings, segments và cập nhật lại trạng thái sách) - Dành cho Staff
        /// </summary>
        [HttpDelete("{editionId}")]
        [Authorize(Roles = "Staff,Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteEdition([FromRoute] int editionId, CancellationToken ct)
        {
            var edition = await _editionRepository.GetByIdWithBookAsync(editionId, ct);
            if (edition == null)
            {
                return NotFound(new { message = "Không tìm thấy ấn bản E-Book cần gỡ bỏ." });
            }

            int bookId = edition.BookId;
            string? oldFileTitle = edition.FileTitle;
            string? oldDropboxPath = edition.DropboxPath;

            // 1. Xóa file PDF/EPUB trên Dropbox nếu có
            if (!string.IsNullOrWhiteSpace(oldDropboxPath))
            {
                try
                {
                    await _fileStorageService.DeleteFileAsync(oldDropboxPath);
                }
                catch
                {
                    // Tiếp tục dọn dẹp DB nếu có sự cố mạng
                }
            }

            // Xóa toàn bộ thư mục âm thanh TTS của ấn bản này trên Dropbox
            try
            {
                await _fileStorageService.DeleteFileAsync($"tts-audio/{editionId}");
            }
            catch
            {
                // Thư mục có thể chưa tạo hoặc đã xóa
            }

            // 2. Dọn sạch embeddings RAG
            var embeddings = await _context.BookEmbeddings
                .Where(e => e.EditionId == editionId)
                .ToListAsync(ct);
            if (embeddings.Any())
            {
                _context.BookEmbeddings.RemoveRange(embeddings);
            }

            // 3. Dọn sạch BookTtsSegments
            var segments = await _context.BookTtsSegments
                .Where(s => s.EditionId == editionId)
                .ToListAsync(ct);
            if (segments.Any())
            {
                _context.BookTtsSegments.RemoveRange(segments);
            }

            // 4. Dọn sạch CopilotChatHistories
            var chatHistories = await _context.CopilotChatHistories
                .Where(h => h.EditionId == editionId)
                .ToListAsync(ct);
            if (chatHistories.Any())
            {
                _context.CopilotChatHistories.RemoveRange(chatHistories);
            }

            // 5. Xóa bản ghi EbookEdition
            _context.EbookEditions.Remove(edition);

            // 6. Cập nhật trạng thái sách nếu không còn ấn bản nào khác đã phát hành
            var book = edition.Book ?? await _context.Books.FirstOrDefaultAsync(b => b.Id == bookId, ct);
            if (book != null)
            {
                var hasOtherPublished = await _context.EbookEditions
                    .AnyAsync(e => e.BookId == bookId && e.Id != editionId && e.Status == EditionPublishStatus.Published, ct);
                if (!hasOtherPublished)
                {
                    book.IsEBookAvailable = false;
                }
            }

            await _context.SaveChangesAsync(ct);

            // 7. Ghi Audit Log
            await _auditLogService.LogAsync(
                action: "UNPUBLISH_EBOOK",
                module: "EbookManagement",
                entityName: "EbookEdition",
                recordId: editionId.ToString(),
                oldValues: JsonSerializer.Serialize(new { EditionId = editionId, BookId = bookId, FileTitle = oldFileTitle }),
                newValues: null,
                details: $"Gỡ bỏ ấn bản E-Book #{editionId} ({oldFileTitle}) khỏi sách ID {bookId}.",
                userId: CurrentUserId,
                ipAddress: ClientIpAddress
            );

            return Ok(new
            {
                success = true,
                message = "Đã gỡ ấn bản E-Book thành công.",
                bookId,
                editionId
            });
        }

        /// <summary>
        /// Gỡ bỏ toàn bộ ấn bản E-Book của một đầu sách - Dành cho Staff
        /// </summary>
        [HttpDelete("book/{bookId}")]
        [Authorize(Roles = "Staff,Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteEditionsByBookId([FromRoute] int bookId, CancellationToken ct)
        {
            var editions = await _context.EbookEditions
                .Where(e => e.BookId == bookId)
                .ToListAsync(ct);

            if (!editions.Any())
            {
                return NotFound(new { message = "Đầu sách này chưa có ấn bản E-Book nào." });
            }

            foreach (var edition in editions)
            {
                if (!string.IsNullOrWhiteSpace(edition.DropboxPath))
                {
                    try { await _fileStorageService.DeleteFileAsync(edition.DropboxPath); } catch { }
                }

                try { await _fileStorageService.DeleteFileAsync($"tts-audio/{edition.Id}"); } catch { }

                var edId = edition.Id;
                var embeddings = await _context.BookEmbeddings.Where(e => e.EditionId == edId).ToListAsync(ct);
                if (embeddings.Any()) _context.BookEmbeddings.RemoveRange(embeddings);

                var segments = await _context.BookTtsSegments.Where(s => s.EditionId == edId).ToListAsync(ct);
                if (segments.Any()) _context.BookTtsSegments.RemoveRange(segments);

                var chatHistories = await _context.CopilotChatHistories.Where(h => h.EditionId == edId).ToListAsync(ct);
                if (chatHistories.Any()) _context.CopilotChatHistories.RemoveRange(chatHistories);
            }

            _context.EbookEditions.RemoveRange(editions);

            var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == bookId, ct);
            if (book != null)
            {
                book.IsEBookAvailable = false;
            }

            await _context.SaveChangesAsync(ct);

            await _auditLogService.LogAsync(
                action: "UNPUBLISH_ALL_EBOOKS",
                module: "EbookManagement",
                entityName: "EbookEdition",
                recordId: bookId.ToString(),
                oldValues: JsonSerializer.Serialize(new { BookId = bookId, RemovedCount = editions.Count }),
                newValues: null,
                details: $"Gỡ bỏ tất cả {editions.Count} ấn bản E-Book của sách ID {bookId}.",
                userId: CurrentUserId,
                ipAddress: ClientIpAddress
            );

            return Ok(new
            {
                success = true,
                message = "Đã gỡ toàn bộ ấn bản E-Book của sách thành công.",
                bookId,
                removedCount = editions.Count
            });
        }

        /// <summary>
        /// Hỏi đáp AI Copilot dựa trên RAG + Bôi đen (SelectedText) + Trang hiện tại (CurrentPage) - Dành cho Staff và Customer
        /// </summary>
        [HttpPost("{editionId}/ask-copilot")]
        [Authorize(Roles = "Staff,Member,Admin")]
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

            var edition = await _editionRepository.GetByIdAsync(editionId, ct);
            if (edition == null)
            {
                return NotFound(new { message = "Không tìm thấy ấn bản E-Book." });
            }

            // Chế độ Thị giác (Sách ảnh/Scan) KHÔNG hỗ trợ AI Copilot, bất kể trong DB có embeddings hay không
            if (edition.PresetType == EbookPresetType.ScannedBook)
            {
                return BadRequest(new { message = "Chế độ ấn bản Thị giác (Sách ảnh/Scan) không hỗ trợ tính năng Trợ lý đọc sách AI Copilot." });
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
                CreatedAt = TimeZoneHelper.GetVietnamTime()
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
                    PageNumber = c.PageNumber ?? 0,
                    ChunkIndex = c.ChunkIndex,
                    ChunkContent = c.ChunkContent
                }).ToList()
            };

            return Ok(response);
        }

        /// <summary>
        /// Lấy lịch sử trò chuyện với AI Copilot cho ấn bản sách này - Dành cho Staff và Customer
        /// </summary>
        [HttpGet("{editionId}/copilot-history")]
        [Authorize(Roles = "Staff,Member,Admin")]
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

        [HttpGet("book/{bookId:int}/edition")]
        [Authorize]
        public async Task<IActionResult> GetPublishedEditionByBookId(
            [FromRoute] int bookId,
            CancellationToken ct)
        {
            var edition = await _context.EbookEditions
                .AsNoTracking()
                .Include(e => e.Book)
                .Where(e => e.BookId == bookId && e.Status == EditionPublishStatus.Published)
                .OrderByDescending(e => e.PublishedAt ?? e.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (edition == null)
            {
                return NotFound(new { message = "Sách này chưa có ấn bản điện tử được xuất bản." });
            }

            return Ok(new
            {
                editionId = edition.Id,
                bookId = edition.BookId,
                title = edition.Book?.Title ?? edition.FileTitle,
                author = edition.Book?.Author ?? string.Empty,
                totalPages = edition.TotalPages,
                ttsEnabled = edition.IsTtsEnabled,
                chatEnabled = edition.PresetType != EbookPresetType.ScannedBook
            });
        }

        [HttpGet("{editionId:int}/file")]
        [Authorize(Roles = "Staff,Member,Admin")]
        public async Task<IActionResult> GetEditionFile([FromRoute] int editionId, CancellationToken ct)
        {
            var edition = await _editionRepository.GetByIdAsync(editionId, ct);
            if (edition == null || string.IsNullOrWhiteSpace(edition.DropboxPath))
            {
                return NotFound(new { message = "Không tìm thấy tệp ấn bản E-Book." });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Member" && edition.Status != EditionPublishStatus.Published)
            {
                return NotFound(new { message = "Ấn bản E-Book này chưa được phát hành chính thức." });
            }

            var stream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
            string contentType = edition.Format == EbookFormat.Pdf
                ? "application/pdf"
                : "application/epub+zip";

            return File(stream, contentType, edition.FileTitle, enableRangeProcessing: true);
        }
    }
}