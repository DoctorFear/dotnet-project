using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AncientBook.Infrastructure.Services
{
    public class RagSearchService : IRagSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly IGeminiEmbeddingService _geminiEmbeddingService;
        private readonly int _topK;
        private readonly double _minSimilarityScore;

        public RagSearchService(
            ApplicationDbContext context,
            IGeminiEmbeddingService geminiEmbeddingService,
            IConfiguration configuration)
        {
            _context = context;
            _geminiEmbeddingService = geminiEmbeddingService;

            // Đọc cấu hình trực tiếp từ appsettings.json
            _topK = configuration.GetValue<int>("RagSettings:TopK", 3);
            _minSimilarityScore = configuration.GetValue<double>("RagSettings:MinSimilarityScore", 0.55);
        }

        public async Task<List<BookEmbedding>> SearchRelevantChunksAsync(
            int editionId,
            string userQuestion,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(userQuestion))
                return new List<BookEmbedding>();

            var questionVector = await _geminiEmbeddingService.GetEmbeddingAsync(userQuestion, ct);
            Console.WriteLine($"[RAG LOG] Question Vector Length: {questionVector?.Length ?? 0}");

            var chunks = await _context.BookEmbeddings
                .Where(b => b.EditionId == editionId)
                .ToListAsync(ct);

            Console.WriteLine($"[RAG LOG] Total Chunks in DB for Edition {editionId}: {chunks.Count}");

            var scoredChunks = new List<ScoredChunk>();

            foreach (var chunk in chunks)
            {
                if (string.IsNullOrWhiteSpace(chunk.EmbeddingJson))
                    continue;

                try
                {
                    var chunkVector = JsonSerializer.Deserialize<float[]>(chunk.EmbeddingJson);

                    // In log để xem có bị lệch độ dài vector hay không
                    if (chunkVector == null || chunkVector.Length != questionVector.Length)
                    {
                        Console.WriteLine($"[RAG LOG] Mismatch vector length: Chunk={chunkVector?.Length} vs Question={questionVector?.Length}");
                        continue;
                    }

                    double similarity = ComputeCosineSimilarity(questionVector, chunkVector);
                    Console.WriteLine($"[RAG LOG] Chunk Id {chunk.Id} - Similarity: {similarity:F4}");

                    // Đặt tạm ngưỡng thấp 0.3 để kiểm tra
                    if (similarity >= _minSimilarityScore)
                    {
                        scoredChunks.Add(new ScoredChunk { Chunk = chunk, Score = similarity });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[RAG LOG] Error deserializing chunk {chunk.Id}: {ex.Message}");
                }
            }

            Console.WriteLine($"[RAG LOG] Scored Chunks matched: {scoredChunks.Count}");

            return scoredChunks
                .OrderByDescending(x => x.Score)
                .Take(_topK)
                .Select(x => x.Chunk)
                .ToList();
        }

        private static double ComputeCosineSimilarity(float[] vectorA, float[] vectorB)
        {
            double dotProduct = 0.0;
            double normA = 0.0;
            double normB = 0.0;

            for (int i = 0; i < vectorA.Length; i++)
            {
                dotProduct += vectorA[i] * vectorB[i];
                normA += vectorA[i] * vectorA[i];
                normB += vectorB[i] * vectorB[i];
            }

            if (normA == 0.0 || normB == 0.0)
                return 0.0;

            return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }

        private class ScoredChunk
        {
            public BookEmbedding Chunk { get; set; } = null!;
            public double Score { get; set; }
        }
    }
}