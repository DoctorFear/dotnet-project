using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AncientBook.Infrastructure.Services
{
    public class GeminiEmbeddingService : IGeminiEmbeddingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiEmbeddingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct = default)
        {
            // Sử dụng model chính thức: gemini-embedding-001
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={_apiKey}";

            var requestBody = new
            {
                content = new
                {
                    parts = new[]
                    {
                        new { text = text }
                    }
                },
                // Chỉ định chiều vector trả về 768 (hoặc 1536 / 3072 tùy thiết kế của bạn)
                outputDimensionality = 768
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(url, jsonContent, ct);

            if (!response.IsSuccessStatusCode)
            {
                var errorDetail = await response.Content.ReadAsStringAsync(ct);
                throw new HttpRequestException($"Google API error ({response.StatusCode}): {errorDetail}");
            }

            var responseString = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseString);

            // Trích xuất mảng vector float từ response: { "embedding": { "values": [...] } }
            var valuesElement = doc.RootElement
                .GetProperty("embedding")
                .GetProperty("values");

            var vector = JsonSerializer.Deserialize<float[]>(valuesElement.GetRawText());
            return vector ?? Array.Empty<float>();
        }
    }
}