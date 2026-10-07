using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Interfaces;


namespace AncientBook.Infrastructure.Services
{
    public interface IEbookTtsService
    {
        Task<TtsGenerateResultDto> GenerateTtsAsync(int editionId, string language, CancellationToken ct = default);
        Task<List<PageTtsResponseDto>> GetPageSegmentsAsync(int editionId, int pageNumber, CancellationToken ct = default);
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

        public async Task<TtsGenerateResultDto> GenerateTtsAsync(int editionId, string language, CancellationToken ct = default)
        {
            // 1. Lấy thông tin ấn bản sách qua Repo
            var edition = await _editionRepo.GetByIdAsync(editionId, ct);
            if (edition == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy ấn bản sách với ID {editionId}.");
            }

            if (string.IsNullOrWhiteSpace(edition.DropboxPath))
            {
                throw new InvalidOperationException("Ấn bản chưa có đường dẫn tệp trên Dropbox (DropboxPath).");
            }

            // 2. Tải Stream tệp gốc (.epub/.pdf) từ Dropbox
            Stream bookStream;
            try
            {
                bookStream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Không thể tải sách từ Dropbox: {ex.Message}", ex);
            }

            // 3. Dọn dẹp bản ghi cũ nếu admin bấm tạo lại
            var oldSegments = await _segmentRepo.GetByEditionIdAsync(editionId, ct);
            if (oldSegments.Any())
            {
                await _segmentRepo.DeleteRangeAsync(oldSegments, ct);
            }

            // 4. Bóc tách các khối văn bản (Overlap = 0)
            List<TtsSegmentDto> rawSegments;
            using (bookStream)
            {
                rawSegments = _ttsExtractor.ExtractSegments(bookStream, edition.PresetType);
            }

            if (rawSegments == null || !rawSegments.Any())
            {
                throw new InvalidOperationException("Không trích xuất được khối văn bản nào từ tệp sách.");
            }

            // 5. Sinh giọng đọc AI & Upload từng đoạn MP3 lên thư mục Dropbox: tts-audio/{editionId}
            var newSegments = new List<BookTtsSegment>();
            string ttsSubFolder = $"tts-audio/{editionId}";

            foreach (var seg in rawSegments)
            {
                if (string.IsNullOrWhiteSpace(seg.TextContent))
                    continue;

                var fileFemaleName = $"p{seg.PageNumber}_s{seg.SegmentIndex}_female.mp3";
                var fileMaleName = $"p{seg.PageNumber}_s{seg.SegmentIndex}_male.mp3";

                // Giọng nữ
                var femaleBytes = await _ttsAudioService.SynthesizeSpeechAsync(seg.TextContent, "female", language, ct);
                var urlFemale = await _fileStorageService.SaveBytesFileAsync(femaleBytes, fileFemaleName, ttsSubFolder);
                await Task.Delay(150, ct);

                // Giọng nam
                var maleBytes = await _ttsAudioService.SynthesizeSpeechAsync(seg.TextContent, "male", language, ct);
                var urlMale = await _fileStorageService.SaveBytesFileAsync(maleBytes, fileMaleName, ttsSubFolder);
                await Task.Delay(150, ct);

                newSegments.Add(new BookTtsSegment
                {
                    EditionId = editionId,
                    PageNumber = seg.PageNumber,
                    SegmentIndex = seg.SegmentIndex,
                    TextContent = seg.TextContent,
                    AudioUrlFemale = urlFemale,
                    AudioUrlMale = urlMale
                });
            }

            // 6. Lưu segments mới & đánh dấu sách đã bật TTS
            await _segmentRepo.AddRangeAsync(newSegments, ct);
            edition.IsTtsEnabled = true;

            // Nếu IEbookEditionRepository có hàm Update đồng bộ thì mở comment dòng này:
            // _editionRepo.Update(edition);

            // Lưu toàn bộ thay đổi (gồm cả newSegments và cờ edition.IsTtsEnabled)
            await _segmentRepo.SaveChangesAsync(ct);

            return new TtsGenerateResultDto
            {
                Success = true,
                Message = $"Tạo âm thanh TTS ({language}) và đồng bộ lên Dropbox thành công.",
                TotalSegmentsGenerated = newSegments.Count
            };
        }

        public async Task<List<PageTtsResponseDto>> GetPageSegmentsAsync(int editionId, int pageNumber, CancellationToken ct = default)
        {
            var segments = await _segmentRepo.GetByEditionAndPageAsync(editionId, pageNumber, ct);

            return segments
                .OrderBy(s => s.SegmentIndex)
                .Select(s => new PageTtsResponseDto
                {
                    SegmentIndex = s.SegmentIndex,
                    PageNumber = s.PageNumber,
                    TextContent = s.TextContent,
                    AudioUrlFemale = s.AudioUrlFemale,
                    AudioUrlMale = s.AudioUrlMale
                })
                .ToList();
        }
    }
}