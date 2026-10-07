using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace AncientBook.Infrastructure.Services
{


    public class TtsAudioService : ITtsAudioService
    {
        private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(60) };
        private const string ProxyUrl = "http://127.0.0.1:5050/synthesize";

        public async Task<byte[]> SynthesizeSpeechAsync(string text, string gender, string language = "vi", CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Nội dung rỗng", nameof(text));

            var payload = new
            {
                text = text,
                language = string.IsNullOrWhiteSpace(language) ? "vi" : language,
                gender = gender
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(ProxyUrl, jsonContent, ct);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                throw new InvalidOperationException($"Lỗi TTS Proxy: {err}");
            }

            return await response.Content.ReadAsByteArrayAsync(ct);
        }
    }
}