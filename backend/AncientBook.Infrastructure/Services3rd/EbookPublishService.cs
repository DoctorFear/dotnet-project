using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Common;
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
        private readonly ITtsDocumentExtractorService _ttsDocumentExtractor;
        private readonly ITextChunker _textChunker;
        private readonly IGeminiEmbeddingService _geminiService;
        private readonly ApplicationDbContext _context;

        public EbookPublishService(
            IEbookEditionRepository editionRepository,
            IBookEmbeddingRepository embeddingRepository,
            IFileStorageService fileStorageService,
            IDocumentExtractor documentExtractor,
            ITtsDocumentExtractorService ttsDocumentExtractor,
            ITextChunker textChunker,
            IGeminiEmbeddingService geminiService,
            ApplicationDbContext context)
        {
            _editionRepository = editionRepository;
            _embeddingRepository = embeddingRepository;
            _fileStorageService = fileStorageService;
            _documentExtractor = documentExtractor;
            _ttsDocumentExtractor = ttsDocumentExtractor;
            _textChunker = textChunker;
            _geminiService = geminiService;
            _context = context;
        }

        public async Task<bool> PublishEditionAsync(int editionId, EbookPresetType selectedPresetType, CancellationToken ct = default)
        {
            var edition = await _editionRepository.GetByIdWithBookAsync(editionId, ct);
            if (edition == null) return false;

            edition.PresetType = selectedPresetType;
            if (selectedPresetType != EbookPresetType.EpubStandard)
            {
                edition.IsTtsEnabled = false;
            }
            edition.Status = EditionPublishStatus.Processing;
            await _context.SaveChangesAsync(ct);

            int bookId = edition.BookId;

            try
            {
                // =========================================================================
                // GIAI ĐOẠN 1: BÓC TÁCH VĂN BẢN, LƯU TEXT THEO TRANG & SINH VECTOR RAG
                // =========================================================================
                var embeddingsToInsert = new List<BookEmbedding>();
                var pageTextSegmentsToInsert = new List<BookTtsSegment>();

                if (selectedPresetType != EbookPresetType.ScannedBook)
                {
                    using var fileStream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);

                    // 1a. Bóc tách từng đoạn văn bản theo trang để lưu sẵn vào DB cho E-Reader hiển thị
                    var extractedSegments = _ttsDocumentExtractor.ExtractSegments(fileStream, selectedPresetType);
                    foreach (var seg in extractedSegments)
                    {
                        if (string.IsNullOrWhiteSpace(seg.TextContent)) continue;

                        pageTextSegmentsToInsert.Add(new BookTtsSegment
                        {
                            EditionId = edition.Id,
                            PageNumber = seg.PageNumber,
                            SegmentIndex = seg.SegmentIndex,
                            TextContent = seg.TextContent,
                            AudioUrlFemale = string.Empty,
                            AudioUrlMale = string.Empty,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // 1b. Bóc tách & chia chunk để sinh Vector RAG cho Copilot
                    if (fileStream.CanSeek) fileStream.Position = 0;
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
                            EmbeddingJson = JsonSerializer.Serialize(vector),
                            Vector = vector
                        });

                        await Task.Delay(80, ct);
                    }
                }

                // =========================================================================
                // GIAI ĐOẠN 2: CLEAN REPLACE (XÓA TOÀN BỘ FILE & DỮ LIỆU CŨ CỦA ĐẦU SÁCH NÀY)
                // =========================================================================
                var oldEditions = await _context.EbookEditions
                    .Where(e => e.BookId == bookId && e.Id != editionId)
                    .ToListAsync(ct);

                if (oldEditions.Any())
                {
                    var oldEditionIds = oldEditions.Select(e => e.Id).ToList();

                    var oldEmbeddings = await _context.BookEmbeddings
                        .Where(b => oldEditionIds.Contains(b.EditionId))
                        .ToListAsync(ct);
                    if (oldEmbeddings.Any())
                        _context.BookEmbeddings.RemoveRange(oldEmbeddings);

                    var oldSegments = await _context.BookTtsSegments
                        .Where(s => oldEditionIds.Contains(s.EditionId))
                        .ToListAsync(ct);
                    if (oldSegments.Any())
                        _context.BookTtsSegments.RemoveRange(oldSegments);

                    var oldHistories = await _context.CopilotChatHistories
                        .Where(h => oldEditionIds.Contains(h.EditionId))
                        .ToListAsync(ct);
                    if (oldHistories.Any())
                        _context.CopilotChatHistories.RemoveRange(oldHistories);

                    foreach (var oldEdition in oldEditions)
                    {
                        if (!string.IsNullOrWhiteSpace(oldEdition.DropboxPath))
                        {
                            try { await _fileStorageService.DeleteFileAsync(oldEdition.DropboxPath); } catch { }
                        }
                        try { await _fileStorageService.DeleteFileAsync($"tts-audio/{oldEdition.Id}"); } catch { }
                    }

                    _context.EbookEditions.RemoveRange(oldEditions);
                }

                var selfOldEmbeddings = await _context.BookEmbeddings
                    .Where(b => b.EditionId == editionId)
                    .ToListAsync(ct);
                if (selfOldEmbeddings.Any())
                    _context.BookEmbeddings.RemoveRange(selfOldEmbeddings);

                var selfOldSegments = await _context.BookTtsSegments
                    .Where(s => s.EditionId == editionId)
                    .ToListAsync(ct);
                if (selfOldSegments.Any())
                    _context.BookTtsSegments.RemoveRange(selfOldSegments);

                // =========================================================================
                // GIAI ĐOẠN 3: LƯU TEXT SEGMENTS, EMBEDDINGS MỚI & CẬP NHẬT TRẠNG THÁI SÁCH
                // =========================================================================
                if (pageTextSegmentsToInsert.Any())
                {
                    await _context.BookTtsSegments.AddRangeAsync(pageTextSegmentsToInsert, ct);
                }

                if (embeddingsToInsert.Any())
                {
                    await _context.BookEmbeddings.AddRangeAsync(embeddingsToInsert, ct);
                }

                edition.Status = EditionPublishStatus.Published;
                edition.PublishedAt = TimeZoneHelper.GetVietnamTime();

                if (edition.Book != null)
                {
                    edition.Book.IsEBookAvailable = true;
                }

                await _context.SaveChangesAsync(ct);
                return true;
            }
            catch (Exception)
            {
                edition.Status = EditionPublishStatus.Failed;
                await _context.SaveChangesAsync(CancellationToken.None);
                throw;
            }
        }
    }
}