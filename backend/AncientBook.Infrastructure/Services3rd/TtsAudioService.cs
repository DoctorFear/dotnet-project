using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AncientBook.Infrastructure.Services
{
    public class TtsAudioService : ITtsAudioService
    {
        private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromMinutes(3) };
        private readonly string _proxyUrl;
        private readonly bool _preferLocal;
        private readonly string _geminiApiKey;

        public TtsAudioService(IConfiguration configuration)
        {
            _proxyUrl = configuration["Tts:LocalProxyUrl"] ?? "http://127.0.0.1:5050/synthesize";
            _preferLocal = configuration.GetValue<bool>("Tts:PreferLocal");
            _geminiApiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<byte[]> SynthesizeSpeechAsync(string text, string gender, string language = "vi", CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Nội dung rỗng", nameof(text));

            var payload = new
            {
                text,
                language = string.IsNullOrWhiteSpace(language) ? "vi" : language,
                gender,
                engine = _preferLocal ? "local" : "auto",
                geminiApiKey = _geminiApiKey
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(_proxyUrl, jsonContent, ct);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                throw new InvalidOperationException($"Lỗi TTS Proxy: {err}");
            }

            return await response.Content.ReadAsByteArrayAsync(ct);
        }
    }
}