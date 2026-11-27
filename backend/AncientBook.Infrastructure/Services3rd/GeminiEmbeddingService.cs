using System;
using System.Collections.Generic;
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
        private const int EmbeddingDimensions = 768;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiEmbeddingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return GenerateLocalEmbedding(string.Empty, EmbeddingDimensions);
            }

            if (!string.IsNullOrWhiteSpace(_apiKey))
            {
                try
                {
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
                        outputDimensionality = EmbeddingDimensions
                    };

                    using var jsonContent = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        Encoding.UTF8,
                        "application/json"
                    );

                    using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    timeoutCts.CancelAfter(TimeSpan.FromSeconds(10));

                    var response = await _httpClient.PostAsync(url, jsonContent, timeoutCts.Token);

                    if (response.IsSuccessStatusCode)
                    {
                        var responseString = await response.Content.ReadAsStringAsync(timeoutCts.Token);
                        using var doc = JsonDocument.Parse(responseString);

                        var valuesElement = doc.RootElement
                            .GetProperty("embedding")
                            .GetProperty("values");

                        var vector = JsonSerializer.Deserialize<float[]>(valuesElement.GetRawText());
                        if (vector != null && vector.Length == EmbeddingDimensions)
                        {
                            NormalizeL2(vector);
                            return vector;
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[GeminiEmbeddingService] API Warning ({response.StatusCode}). Fallback sang Local Embedding.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[GeminiEmbeddingService] Exception connecting to Gemini API ({ex.Message}). Tự động fallback sang Local Embedding.");
                }
            }

            return GenerateLocalEmbedding(text, EmbeddingDimensions);
        }

        public static float[] GenerateLocalEmbedding(string text, int dimensions = EmbeddingDimensions)
        {
            var vector = new float[dimensions];
            if (string.IsNullOrWhiteSpace(text))
                return vector;

            var clean = text.ToLowerInvariant();
            var tokens = clean.Split(
                new[] { ' ', '\r', '\n', '\t', ',', '.', ';', ':', '!', '?', '-', '(', ')', '"', '\'' },
                StringSplitOptions.RemoveEmptyEntries);

            foreach (var token in tokens)
            {
                if (token.Length == 0) continue;

                uint hash = 2166136261;
                foreach (char c in token)
                {
                    hash = (hash ^ c) * 16777619;
                }

                int index = (int)(hash % (uint)dimensions);
                float sign = ((hash >> 16) & 1) == 0 ? 1.0f : -1.0f;
                vector[index] += sign * (1.0f + (float)Math.Log(1 + token.Length));

                if (token.Length >= 3)
                {
                    for (int i = 0; i <= token.Length - 3; i++)
                    {
                        uint triHash = 2166136261;
                        for (int j = 0; j < 3; j++)
                        {
                            triHash = (triHash ^ token[i + j]) * 16777619;
                        }
                        int triIdx = (int)(triHash % (uint)dimensions);
                        float triSign = ((triHash >> 8) & 1) == 0 ? 0.5f : -0.5f;
                        vector[triIdx] += triSign;
                    }
                }
            }

            NormalizeL2(vector);
            return vector;
        }

        private static void NormalizeL2(float[] vector)
        {
            double norm = 0.0;
            for (int i = 0; i < vector.Length; i++)
            {
                norm += vector[i] * vector[i];
            }

            if (norm > 0)
            {
                float sqrtNorm = (float)Math.Sqrt(norm);
                for (int i = 0; i < vector.Length; i++)
                {
                    vector[i] /= sqrtNorm;
                }
            }
        }

        public async Task<string> GenerateCopilotAnswerAsync(
            string question,
            string? selectedText,
            int? currentPage,
            List<string> citations,
            CancellationToken ct = default)
        {
            var promptBuilder = new StringBuilder();
            promptBuilder.AppendLine("Bạn là trợ lý đọc sách AI (Copilot) thông thái của nền tảng AncientBook.");
            promptBuilder.AppendLine("Nhiệm vụ: Trả lời câu hỏi của độc giả dựa trên tác phẩm văn học đang đọc.");
            promptBuilder.AppendLine("Nguyên tắc:");
            promptBuilder.AppendLine("- Trả lời bám sát ngữ cảnh trích dẫn của sách, không bịa đặt.");
            promptBuilder.AppendLine("- Nếu độc giả hỏi từ cổ, tiếng địa phương hoặc điển tích, hãy giải thích rõ ràng từng bước và ý nghĩa trong văn cảnh.");
            promptBuilder.AppendLine("- Văn phong nhã nhặn, mang tính đàm đạo văn chương, dễ hiểu.");
            promptBuilder.AppendLine();

            if (currentPage.HasValue && currentPage.Value > 0)
            {
                promptBuilder.AppendLine($"[Vị trí trang độc giả đang mở]: Trang {currentPage.Value}");
            }

            if (!string.IsNullOrWhiteSpace(selectedText))
            {
                promptBuilder.AppendLine($"[Đoạn văn bản độc giả bôi đen cần chú ý đặc biệt]: \"{selectedText.Trim()}\"");
            }

            promptBuilder.AppendLine();
            promptBuilder.AppendLine("[Các đoạn trích dẫn liên quan tìm thấy từ cuốn sách]:");
            if (citations != null && citations.Count > 0)
            {
                foreach (var cite in citations)
                {
                    promptBuilder.AppendLine($"- {cite}");
                }
            }
            else
            {
                promptBuilder.AppendLine("- (Không tìm thấy trích đoạn cụ thể, hãy trả lời ngắn gọn bám sát câu hỏi)");
            }

            promptBuilder.AppendLine();
            promptBuilder.AppendLine($"[Câu hỏi của độc giả]: {question}");
            promptBuilder.AppendLine("Câu trả lời của bạn:");

            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return await BuildLocalCopilotFallbackAsync(question, selectedText, currentPage, citations, promptBuilder.ToString(), ct);
            }

            var modelsToTry = new[] { "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash" };

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = promptBuilder.ToString() }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.4,
                    maxOutputTokens = 4096
                }
            };

            foreach (var model in modelsToTry)
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_apiKey}";

                using var jsonContent = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"
                );

                try
                {
                    using var modelCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                    modelCts.CancelAfter(TimeSpan.FromSeconds(20));

                    var response = await _httpClient.PostAsync(url, jsonContent, modelCts.Token);
                    var responseString = await response.Content.ReadAsStringAsync(modelCts.Token);

                    if (response.IsSuccessStatusCode)
                    {
                        using var doc = JsonDocument.Parse(responseString);
                        var root = doc.RootElement;
                        if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                        {
                            var text = candidates[0]
                                .GetProperty("content")
                                .GetProperty("parts")[0]
                                .GetProperty("text")
                                .GetString();

                            if (!string.IsNullOrWhiteSpace(text))
                                return text;
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[GeminiCopilot] Model {model} failed ({(int)response.StatusCode}): {responseString}");
                    }
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[GeminiCopilot] Model {model} exception: {ex.Message}");
                }

                await Task.Delay(300, ct);
            }

            return await BuildLocalCopilotFallbackAsync(question, selectedText, currentPage, citations, promptBuilder.ToString(), ct);
        }

        private async Task<string> BuildLocalCopilotFallbackAsync(
            string question,
            string? selectedText,
            int? currentPage,
            List<string>? citations,
            string promptText,
            CancellationToken ct)
        {
            // 1. Thử Local LLM (Ollama hoặc LM Studio) nếu có
            try
            {
                var localLlmUrl = "http://localhost:11434/api/generate";
                var localPayload = new
                {
                    model = "llama3.2",
                    prompt = promptText,
                    stream = false
                };

                using var localContent = new StringContent(
                    JsonSerializer.Serialize(localPayload),
                    Encoding.UTF8,
                    "application/json"
                );

                using var localCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                localCts.CancelAfter(TimeSpan.FromSeconds(10));

                var localResp = await _httpClient.PostAsync(localLlmUrl, localContent, localCts.Token);
                if (localResp.IsSuccessStatusCode)
                {
                    var localStr = await localResp.Content.ReadAsStringAsync(localCts.Token);
                    using var localDoc = JsonDocument.Parse(localStr);
                    if (localDoc.RootElement.TryGetProperty("response", out var respProp))
                    {
                        var ans = respProp.GetString();
                        if (!string.IsNullOrWhiteSpace(ans))
                        {
                            return $"{ans}\n\n*(⚡ Trả lời tự động qua Local LLM Fallback (Ollama))*";
                        }
                    }
                }
            }
            catch
            {
                // Local LLM không khả dụng
            }

            // 2. Fallback dựa trên trích dẫn của sách
            var sb = new StringBuilder();
            sb.AppendLine("*(Phản hồi từ chế độ Tri thức RAG Cục bộ do dịch vụ AI trực tuyến tạm thời gián đoạn)*\n");

            if (currentPage.HasValue && currentPage.Value > 0)
            {
                sb.AppendLine($"**Vị trí đang đọc:** Trang {currentPage.Value}\n");
            }

            if (!string.IsNullOrWhiteSpace(selectedText))
            {
                sb.AppendLine($"**Đoạn văn bản đã chọn:**\n> \"{selectedText.Trim()}\"\n");
            }

            if (citations != null && citations.Count > 0)
            {
                sb.AppendLine($"**Các đoạn trích dẫn liên quan trong sách cho câu hỏi** *\"{question}\"*:\n");
                foreach (var cite in citations)
                {
                    sb.AppendLine($"> {cite}\n");
                }
                return sb.ToString().TrimEnd();
            }

            sb.AppendLine($"Đã ghi nhận câu hỏi: \"{question}\" trên trang {currentPage ?? 1}. Hệ thống AI đang bận hoặc ngoại tuyến, vui lòng thử lại sau giây lát hoặc kết nối Local LLM.");
            return sb.ToString().TrimEnd();
        }
    }
}