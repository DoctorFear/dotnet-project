using System;
using System.Net.Http;
using System.Net.Http.Json;
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

        public GeminiEmbeddingService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Gemini:ApiKey"]
                ?? throw new ArgumentNullException("Thiếu cấu hình Gemini:ApiKey trong appsettings.json");
        }

        public async Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct = default)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={_apiKey}";

            var payload = new
            {
                model = "models/text-embedding-004",
                content = new { parts = new[] { new { text } } }
            };

            var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
            response.EnsureSuccessStatusCode();

            using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var values = doc.RootElement
                .GetProperty("embedding")
                .GetProperty("values");

            return JsonSerializer.Deserialize<float[]>(values.GetRawText()) ?? Array.Empty<float>();
        }
    }
}