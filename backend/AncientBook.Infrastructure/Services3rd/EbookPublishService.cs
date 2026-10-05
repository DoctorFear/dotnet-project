using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using AncientBook.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Services
{
    public class EbookPublishService : IEbookPublishService
    {
        private readonly IEbookEditionRepository _editionRepository;
        private readonly IBookEmbeddingRepository _embeddingRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly IDocumentExtractor _documentExtractor;
        private readonly ITextChunker _textChunker;
        private readonly IGeminiEmbeddingService _geminiService;
        private readonly ApplicationDbContext _context;

        public EbookPublishService(
            IEbookEditionRepository editionRepository,
            IBookEmbeddingRepository embeddingRepository,
            IFileStorageService fileStorageService,
            IDocumentExtractor documentExtractor,
            ITextChunker textChunker,
            IGeminiEmbeddingService geminiService,
            ApplicationDbContext context)
        {
            _editionRepository = editionRepository;
            _embeddingRepository = embeddingRepository;
            _fileStorageService = fileStorageService;
            _documentExtractor = documentExtractor;
            _textChunker = textChunker;
            _geminiService = geminiService;
            _context = context;
        }

        public async Task<bool> PublishEditionAsync(int editionId, EbookPresetType selectedPresetType, CancellationToken ct = default)
        {
            var edition = await _editionRepository.GetByIdWithBookAsync(editionId, ct);
            if (edition == null) return false;

            edition.PresetType = selectedPresetType;
            int bookId = edition.BookId;

            // =========================================================================
            // GIAI ĐOẠN 1: BÓC TÁCH VĂN BẢN VÀ SINH VECTOR RAG (NẾU CẦN)
            // =========================================================================
            var embeddingsToInsert = new List<BookEmbedding>();

            if (selectedPresetType != EbookPresetType.ScannedBook)
            {
                // Preset 1 (EpubStandard) & Preset 2 (PdfStandard): Bóc tách text và nạp vector AI
                using var fileStream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
                var rawPages = await _documentExtractor.ExtractRawPagesAsync(fileStream, edition.Format, ct);

                var chunks = _textChunker.ChunkText(rawPages);

                foreach (var chunk in chunks)
                {
                    var vector = await _geminiService.GetEmbeddingAsync(chunk.Text, ct);

                    embeddingsToInsert.Add(new BookEmbedding
                    {
                        EditionId = edition.Id,
                        PageNumber = chunk.PageNumber,
                        ChunkIndex = chunk.ChunkIndex,
                        ChunkContent = chunk.Text,
                        Vector = vector
                    });

                    // Nghỉ ngắn giữa các request để tránh rate-limit API của Google
                    await Task.Delay(80, ct);
                }
            }

            // =========================================================================
            // GIAI ĐOẠN 2: CLEAN REPLACE (XÓA TOÀN BỘ FILE & DỮ LIỆU CŨ CỦA ĐẦU SÁCH NÀY)
            // =========================================================================

            // 1. Tìm tất cả các edition cũ của cùng BookId (khác editionId đang publish)
            var oldEditions = await _context.EbookEditions
                .Where(e => e.BookId == bookId && e.Id != editionId)
                .ToListAsync(ct);

            if (oldEditions.Any())
            {
                var oldEditionIds = oldEditions.Select(e => e.Id).ToList();

                // a. Xóa toàn bộ embeddings cũ trong bảng BookEmbeddings
                var oldEmbeddings = await _context.BookEmbeddings
                    .Where(b => oldEditionIds.Contains(b.EditionId))
                    .ToListAsync(ct);

                if (oldEmbeddings.Any())
                {
                    _context.BookEmbeddings.RemoveRange(oldEmbeddings);
                }

                // b. Xóa các file vật lý cũ trên Dropbox
                foreach (var oldEdition in oldEditions)
                {
                    if (!string.IsNullOrWhiteSpace(oldEdition.DropboxPath))
                    {
                        await _fileStorageService.DeleteFileAsync(oldEdition.DropboxPath);
                    }
                }

                // c. Xóa các bản ghi cũ trong bảng EbookEditions
                _context.EbookEditions.RemoveRange(oldEditions);
            }

            // 2. Dọn sạch embeddings cũ của chính bản ghi này nếu từng được chạy thử trước đó
            var selfOldEmbeddings = await _context.BookEmbeddings
                .Where(b => b.EditionId == editionId)
                .ToListAsync(ct);

            if (selfOldEmbeddings.Any())
            {
                _context.BookEmbeddings.RemoveRange(selfOldEmbeddings);
            }

            // =========================================================================
            // GIAI ĐOẠN 3: LƯU EMBEDDINGS MỚI & CẬP NHẬT TRẠNG THÁI SÁCH
            // =========================================================================
            if (embeddingsToInsert.Any())
            {
                await _context.BookEmbeddings.AddRangeAsync(embeddingsToInsert, ct);
            }

            edition.Status = EditionPublishStatus.Published;
            edition.PublishedAt = DateTime.UtcNow;

            if (edition.Book != null)
            {
                edition.Book.IsEBookAvailable = true;
            }

            await _context.SaveChangesAsync(ct);
            return true;
        }
    }
}