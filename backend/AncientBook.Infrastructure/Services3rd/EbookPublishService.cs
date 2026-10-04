using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Storage;

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

        public EbookPublishService(
            IEbookEditionRepository editionRepository,
            IBookEmbeddingRepository embeddingRepository,
            IFileStorageService fileStorageService,
            IDocumentExtractor documentExtractor,
            ITextChunker textChunker,
            IGeminiEmbeddingService geminiService)
        {
            _editionRepository = editionRepository;
            _embeddingRepository = embeddingRepository;
            _fileStorageService = fileStorageService;
            _documentExtractor = documentExtractor;
            _textChunker = textChunker;
            _geminiService = geminiService;
        }

        public async Task<bool> PublishEditionAsync(int editionId, int selectedPresetId, CancellationToken ct = default)
        {
            var edition = await _editionRepository.GetByIdWithBookAsync(editionId, ct);
            if (edition == null) return false;

            edition.PresetId = selectedPresetId;

            // Preset 3: Xuất bản ngay không cần AI
            if (selectedPresetId == 3)
            {
                edition.Status = EditionPublishStatus.Published;
                edition.PublishedAt = DateTime.UtcNow;

                if (edition.Book != null)
                    edition.Book.IsEBookAvailable = true;

                _editionRepository.Update(edition);
                await _editionRepository.SaveChangesAsync(ct);
                return true;
            }

            // Preset 1 & 2: Bóc tách text và nạp tri thức
            using var fileStream = await _fileStorageService.GetFileStreamAsync(edition.DropboxPath, ct);
            var rawPages = await _documentExtractor.ExtractRawPagesAsync(fileStream, edition.Format, ct);

            var chunks = _textChunker.ChunkText(rawPages);
            var embeddingsToInsert = new List<BookEmbedding>();

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

                await Task.Delay(80, ct);
            }

            await _embeddingRepository.AddRangeAsync(embeddingsToInsert, ct);

            edition.Status = EditionPublishStatus.Published;
            edition.PublishedAt = DateTime.UtcNow;

            if (edition.Book != null)
                edition.Book.IsEBookAvailable = true;

            _editionRepository.Update(edition);
            await _editionRepository.SaveChangesAsync(ct);

            return true;
        }
    }
}