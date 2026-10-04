using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace AncientBook.Infrastructure.Services
{
    public class RagSearchService : IRagSearchService
    {
        private readonly IBookEmbeddingRepository _embeddingRepository;
        private readonly IGeminiEmbeddingService _geminiService;
        private readonly int _topK;
        private readonly float _minSimilarityScore;

        public RagSearchService(
            IBookEmbeddingRepository embeddingRepository,
            IGeminiEmbeddingService geminiService,
            IConfiguration config)
        {
            _embeddingRepository = embeddingRepository;
            _geminiService = geminiService;
            _topK = config.GetValue<int>("RagSettings:TopK", 3);
            _minSimilarityScore = config.GetValue<float>("RagSettings:MinSimilarityScore", 0.55f);
        }

        public async Task<List<BookEmbedding>> SearchRelevantChunksAsync(int editionId, string userQuestion, CancellationToken ct = default)
        {
            float[] queryVector = await _geminiService.GetEmbeddingAsync(userQuestion, ct);

            // Gọi qua Repository thay vì DbContext
            var chunks = await _embeddingRepository.GetByEditionIdAsync(editionId, ct);

            var relevantChunks = chunks
                .Select(chunk => new
                {
                    Chunk = chunk,
                    Score = CosineSimilarity(queryVector, chunk.Vector)
                })
                .Where(x => x.Score >= _minSimilarityScore)
                .OrderByDescending(x => x.Score)
                .Take(_topK)
                .Select(x => x.Chunk)
                .ToList();

            return relevantChunks;
        }

        private static float CosineSimilarity(ReadOnlySpan<float> vecA, ReadOnlySpan<float> vecB)
        {
            if (vecA.Length != vecB.Length || vecA.Length == 0) return 0f;

            float dot = 0f;
            float normA = 0f;
            float normB = 0f;

            for (int i = 0; i < vecA.Length; i++)
            {
                dot += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }

            float denom = MathF.Sqrt(normA) * MathF.Sqrt(normB);
            return denom == 0f ? 0f : (dot / denom);
        }
    }
}