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
            string language = "both",
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
        private static readonly SemaphoreSlim SynthesisGate = new SemaphoreSlim(2);
        private static readonly SemaphoreSlim UploadGate = new SemaphoreSlim(3);
        private static readonly SemaphoreSlim[] EditionGates = Enumerable.Range(0, 64)
            .Select(_ => new SemaphoreSlim(1)).ToArray();

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
            string language = "both",
            int? fromPage = null,
            int? toPage = null,
            CancellationToken ct = default)
        {
            language = (language ?? "both").Trim().ToLowerInvariant();
            if (language != "vi" && language != "en" && language != "both")
                throw new InvalidOperationException("Language must be vi, en or both.");
            if (editionId <= 0 || fromPage is <= 0 || toPage is <= 0 ||
                (fromPage.HasValue && toPage.HasValue && fromPage > toPage))
                throw new InvalidOperationException("Invalid edition or page range.");

            var gate = EditionGates[editionId % EditionGates.Length];
            await gate.WaitAsync(ct);
            try
            {
                return await GenerateCoreAsync(editionId, language, fromPage, toPage, ct);
            }
            finally { gate.Release(); }
        }

        private async Task<string> GenerateVoiceAsync(
            string text, string gender, string language,
            string fileName, string folder, CancellationToken ct)
        {
            byte[]? bytes = null;
            await SynthesisGate.WaitAsync(ct);
            try
            {
                for (int attempt = 1; attempt <= 3; attempt++)
                {
                    try
                    {
                        bytes = await _ttsAudioService.SynthesizeSpeechAsync(text, gender, language, ct);
                        if (bytes != null && bytes.Length > 0)
                            break;
                    }
                    catch (Exception) when (attempt < 3 && !ct.IsCancellationRequested)
                    {
                        await Task.Delay(attempt * 600, ct);
                    }
                }

                if (bytes == null || bytes.Length == 0)
                    throw new InvalidOperationException($"TTS returned empty audio for {language}-{gender}.");
            }
            finally { SynthesisGate.Release(); }

            await UploadGate.WaitAsync(ct);
            try
            {
                ct.ThrowIfCancellationRequested();
                var url = await _fileStorageService.SaveBytesFileAsync(bytes, fileName, folder);
                if (string.IsNullOrWhiteSpace(url))
                    throw new InvalidOperationException("Audio upload returned an empty URL.");
                return url;
            }
            finally { UploadGate.Release(); }
        }

        private async Task<TtsGenerateResultDto> GenerateCoreAsync(
            int editionId, string language,
            int? fromPage, int? toPage, CancellationToken ct)
        {
            var edition = await _editionRepo.GetByIdAsync(editionId, ct);
            if (edition == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy ấn bản sách với ID {editionId}.");
            }

            if (edition.PresetType == EbookPresetType.ScannedBook)
                throw new InvalidOperationException("Scanned books do not support TTS.");

            if (string.IsNullOrWhiteSpace(edition.DropboxPath))
            {
                throw new InvalidOperationException("Ấn bản chưa có đường dẫn tệp trên Dropbox (DropboxPath).");
            }

            Stream bookStream;
            try
            {
                bookStream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
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
            var existingByKey = segmentsToDelete
                .GroupBy(s => (s.PageNumber, s.SegmentIndex))
                .ToDictionary(g => g.Key, g => g.First());

            var work = rawSegments.Where(s => !string.IsNullOrWhiteSpace(s.TextContent)).ToList();
            if (work.Count == 0)
                throw new InvalidOperationException("No readable segments in the selected pages.");

            string ttsSubFolder = $"tts-audio/{editionId}/{Guid.NewGuid():N}";
            bool generateVi = language == "vi" || language == "both";
            bool generateEn = language == "en" || language == "both";
            int totalGenerated = 0;

            var pagesGrouped = work
                .GroupBy(s => s.PageNumber)
                .OrderBy(g => g.Key)
                .ToList();

            foreach (var pageGroup in pagesGrouped)
            {
                ct.ThrowIfCancellationRequested();
                int pageNum = pageGroup.Key;
                var pageWork = pageGroup.OrderBy(s => s.SegmentIndex).ToList();
                var pageResults = new List<BookTtsSegment>(pageWork.Count);

                foreach (var seg in pageWork)
                {
                    ct.ThrowIfCancellationRequested();
                    existingByKey.TryGetValue((seg.PageNumber, seg.SegmentIndex), out var old);
                    if (old != null && !string.Equals(old.TextContent, seg.TextContent, StringComparison.Ordinal))
                        old = null;

                    string prefix = $"p{seg.PageNumber}_s{seg.SegmentIndex}";
                    Task<string> EnsureVoice(bool requested, string? existing, string lang, string gender)
                    {
                        if (!string.IsNullOrWhiteSpace(existing)) return Task.FromResult(existing!);
                        if (!requested) return Task.FromResult(string.Empty);
                        return GenerateVoiceAsync(seg.TextContent, gender, lang,
                            $"{prefix}_{lang}_{gender}.mp3", ttsSubFolder, ct);
                    }

                    var viFemale = EnsureVoice(generateVi, old?.AudioUrlViFemale, "vi", "female");
                    var viMale = EnsureVoice(generateVi, old?.AudioUrlViMale, "vi", "male");
                    var enFemale = EnsureVoice(generateEn, old?.AudioUrlEnFemale, "en", "female");
                    var enMale = EnsureVoice(generateEn, old?.AudioUrlEnMale, "en", "male");
                    await Task.WhenAll(viFemale, viMale, enFemale, enMale);

                    var viFemaleUrl = await viFemale;
                    var viMaleUrl = await viMale;
                    var enFemaleUrl = await enFemale;
                    var enMaleUrl = await enMale;

                    pageResults.Add(new BookTtsSegment
                    {
                        EditionId = editionId,
                        PageNumber = seg.PageNumber,
                        SegmentIndex = seg.SegmentIndex,
                        TextContent = seg.TextContent,
                        AudioUrlViFemale = viFemaleUrl,
                        AudioUrlViMale = viMaleUrl,
                        AudioUrlEnFemale = enFemaleUrl,
                        AudioUrlEnMale = enMaleUrl,
                        AudioUrlFemale = !string.IsNullOrWhiteSpace(viFemaleUrl) ? viFemaleUrl : enFemaleUrl,
                        AudioUrlMale = !string.IsNullOrWhiteSpace(viMaleUrl) ? viMaleUrl : enMaleUrl,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                var oldPageSegments = segmentsToDelete.Where(s => s.PageNumber == pageNum).ToList();
                if (oldPageSegments.Any())
                    await _segmentRepo.DeleteRangeAsync(oldPageSegments, ct);

                await _segmentRepo.AddRangeAsync(pageResults, ct);
                await _segmentRepo.SaveChangesAsync(ct);
                totalGenerated += pageResults.Count;
            }

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
                TotalSegmentsGenerated = totalGenerated
            };
        }

        public async Task<List<PageTtsResponseDto>> GetPageSegmentsAsync(int editionId, int pageNumber, CancellationToken ct = default)
        {
            if (editionId <= 0 || pageNumber <= 0)
                return new List<PageTtsResponseDto>();
            var gate = EditionGates[editionId % EditionGates.Length];
            await gate.WaitAsync(ct);
            try { return await GetPageCoreAsync(editionId, pageNumber, ct); }
            finally { gate.Release(); }
        }

        private async Task<List<PageTtsResponseDto>> GetPageCoreAsync(int editionId, int pageNumber, CancellationToken ct)
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
                        AudioUrlMale = s.AudioUrlMale,
                        AudioUrlViFemale = s.AudioUrlViFemale ?? string.Empty,
                        AudioUrlViMale = s.AudioUrlViMale ?? string.Empty,
                        AudioUrlEnFemale = s.AudioUrlEnFemale ?? string.Empty,
                        AudioUrlEnMale = s.AudioUrlEnMale ?? string.Empty
                    })
                    .ToList();
            }

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
                        AudioUrlViFemale = string.Empty,
                        AudioUrlViMale = string.Empty,
                        AudioUrlEnFemale = string.Empty,
                        AudioUrlEnMale = string.Empty,
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
                        AudioUrlMale = string.Empty,
                        AudioUrlViFemale = string.Empty,
                        AudioUrlViMale = string.Empty,
                        AudioUrlEnFemale = string.Empty,
                        AudioUrlEnMale = string.Empty
                    })
                    .ToList();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                return new List<PageTtsResponseDto>();
            }
        }
    }
}