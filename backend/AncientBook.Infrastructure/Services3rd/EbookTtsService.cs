using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Domain.Interfaces;

namespace AncientBook.Infrastructure.Services
{
    public interface IEbookTtsService
    {
        Task<TtsGenerateResultDto> GenerateTtsAsync(
            int editionId,
            string language = "vi",
            int? fromPage = null,
            int? toPage = null,
            CancellationToken ct = default);

        Task<List<PageTtsResponseDto>> GetPageSegmentsAsync(
            int editionId,
            int pageNumber,
            CancellationToken ct = default);
    }

    public class EbookTtsService : IEbookTtsService
    {
        private readonly IEbookEditionRepository _editionRepo;
        private readonly IBookTtsSegmentRepository _segmentRepo;
        private readonly ITtsDocumentExtractorService _ttsExtractor;
        private readonly ITtsAudioService _ttsAudioService;
        private readonly IFileStorageService _fileStorageService;

        public EbookTtsService(
            IEbookEditionRepository editionRepo,
            IBookTtsSegmentRepository segmentRepo,
            ITtsDocumentExtractorService ttsExtractor,
            ITtsAudioService ttsAudioService,
            IFileStorageService fileStorageService)
        {
            _editionRepo = editionRepo;
            _segmentRepo = segmentRepo;
            _ttsExtractor = ttsExtractor;
            _ttsAudioService = ttsAudioService;
            _fileStorageService = fileStorageService;
        }

        public async Task<TtsGenerateResultDto> GenerateTtsAsync(
            int editionId,
            string language = "vi",
            int? fromPage = null,
            int? toPage = null,
            CancellationToken ct = default)
        {
            var edition = await _editionRepo.GetByIdAsync(editionId, ct);
            if (edition == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy ấn bản sách với ID {editionId}.");
            }

            if (string.IsNullOrWhiteSpace(edition.DropboxPath))
            {
                throw new InvalidOperationException("Ấn bản chưa có đường dẫn tệp trên Dropbox (DropboxPath).");
            }

            Stream bookStream;
            try
            {
                bookStream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Không thể tải sách từ Dropbox: {ex.Message}", ex);
            }

            List<TtsSegmentDto> rawSegments;
            using (bookStream)
            {
                rawSegments = _ttsExtractor.ExtractSegments(bookStream, edition.PresetType);
            }

            if (rawSegments == null || !rawSegments.Any())
            {
                throw new InvalidOperationException("Không trích xuất được khối văn bản nào từ tệp sách.");
            }

            if (fromPage.HasValue)
            {
                rawSegments = rawSegments.Where(s => s.PageNumber >= fromPage.Value).ToList();
            }
            if (toPage.HasValue)
            {
                rawSegments = rawSegments.Where(s => s.PageNumber <= toPage.Value).ToList();
            }

            if (!rawSegments.Any())
            {
                throw new InvalidOperationException("Không có khối văn bản nào nằm trong khoảng trang đã chọn.");
            }

            var existingSegments = await _segmentRepo.GetByEditionIdAsync(editionId, ct);
            var targetPages = rawSegments.Select(s => s.PageNumber).Distinct().ToHashSet();
            var segmentsToDelete = existingSegments.Where(s => targetPages.Contains(s.PageNumber)).ToList();

            if (segmentsToDelete.Any())
            {
                await _segmentRepo.DeleteRangeAsync(segmentsToDelete, ct);
            }

            var newSegments = new List<BookTtsSegment>();
            string ttsSubFolder = $"tts-audio/{editionId}";

            foreach (var seg in rawSegments)
            {
                if (string.IsNullOrWhiteSpace(seg.TextContent))
                    continue;

                var fileFemaleName = $"p{seg.PageNumber}_s{seg.SegmentIndex}_female.mp3";
                var fileMaleName = $"p{seg.PageNumber}_s{seg.SegmentIndex}_male.mp3";

                var femaleBytes = await _ttsAudioService.SynthesizeSpeechAsync(seg.TextContent, "female", language, ct);
                var urlFemale = await _fileStorageService.SaveBytesFileAsync(femaleBytes, fileFemaleName, ttsSubFolder);
                await Task.Delay(120, ct);

                var maleBytes = await _ttsAudioService.SynthesizeSpeechAsync(seg.TextContent, "male", language, ct);
                var urlMale = await _fileStorageService.SaveBytesFileAsync(maleBytes, fileMaleName, ttsSubFolder);
                await Task.Delay(120, ct);

                newSegments.Add(new BookTtsSegment
                {
                    EditionId = editionId,
                    PageNumber = seg.PageNumber,
                    SegmentIndex = seg.SegmentIndex,
                    TextContent = seg.TextContent,
                    AudioUrlFemale = urlFemale,
                    AudioUrlMale = urlMale,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _segmentRepo.AddRangeAsync(newSegments, ct);
            await _segmentRepo.SaveChangesAsync(ct);

            edition.IsTtsEnabled = true;
            _editionRepo.Update(edition);
            await _editionRepo.SaveChangesAsync(ct);

            string pageRangeInfo = fromPage.HasValue || toPage.HasValue
                ? $" (Trang {fromPage?.ToString() ?? "đầu"} đến {toPage?.ToString() ?? "cuối"})"
                : "";

            return new TtsGenerateResultDto
            {
                Success = true,
                Message = $"Tạo âm thanh TTS ({language}){pageRangeInfo} và đồng bộ lên Dropbox thành công.",
                TotalSegmentsGenerated = newSegments.Count
            };
        }

        public async Task<List<PageTtsResponseDto>> GetPageSegmentsAsync(int editionId, int pageNumber, CancellationToken ct = default)
        {
            var segments = await _segmentRepo.GetByEditionAndPageAsync(editionId, pageNumber, ct);

            if (segments.Any())
            {
                return segments
                    .OrderBy(s => s.SegmentIndex)
                    .Select(s => new PageTtsResponseDto
                    {
                        Id = s.Id,
                        SegmentIndex = s.SegmentIndex,
                        PageNumber = s.PageNumber,
                        TextContent = s.TextContent,
                        AudioUrlFemale = s.AudioUrlFemale,
                        AudioUrlMale = s.AudioUrlMale
                    })
                    .ToList();
            }

            // Nếu ấn bản chưa có bất kỳ đoạn văn bản nào lưu trong DB (ví dụ PDF xuất bản trước đó),
            // tự động bóc tách từ Dropbox 1 lần và lưu vào DB để các lần đọc sau tải tức thì
            var anyExistingForEdition = await _segmentRepo.GetByEditionIdAsync(editionId, ct);
            if (anyExistingForEdition.Any())
            {
                return new List<PageTtsResponseDto>();
            }

            var edition = await _editionRepo.GetByIdAsync(editionId, ct);
            if (edition == null ||
                string.IsNullOrWhiteSpace(edition.DropboxPath) ||
                edition.PresetType == EbookPresetType.ScannedBook)
            {
                return new List<PageTtsResponseDto>();
            }

            try
            {
                using var stream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
                var extracted = _ttsExtractor.ExtractSegments(stream, edition.PresetType);
                if (extracted == null || !extracted.Any())
                {
                    return new List<PageTtsResponseDto>();
                }

                var entitiesToCache = extracted
                    .Where(s => !string.IsNullOrWhiteSpace(s.TextContent))
                    .Select(s => new BookTtsSegment
                    {
                        EditionId = editionId,
                        PageNumber = s.PageNumber,
                        SegmentIndex = s.SegmentIndex,
                        TextContent = s.TextContent,
                        AudioUrlFemale = string.Empty,
                        AudioUrlMale = string.Empty,
                        CreatedAt = DateTime.UtcNow
                    })
                    .ToList();

                if (entitiesToCache.Any())
                {
                    await _segmentRepo.AddRangeAsync(entitiesToCache, ct);
                    await _segmentRepo.SaveChangesAsync(ct);
                }

                return entitiesToCache
                    .Where(s => s.PageNumber == pageNumber)
                    .OrderBy(s => s.SegmentIndex)
                    .Select(s => new PageTtsResponseDto
                    {
                        Id = s.Id,
                        PageNumber = s.PageNumber,
                        SegmentIndex = s.SegmentIndex,
                        TextContent = s.TextContent,
                        AudioUrlFemale = string.Empty,
                        AudioUrlMale = string.Empty
                    })
                    .ToList();
            }
            catch
            {
                return new List<PageTtsResponseDto>();
            }
        }
    }
}