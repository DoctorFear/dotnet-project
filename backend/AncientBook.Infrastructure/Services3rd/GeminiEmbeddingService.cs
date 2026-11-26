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
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiEmbeddingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct = default)
        {
            // Dùng v1beta với model chính xác có trong danh sách của bạn
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={_apiKey}";

            // Khi model đã nằm trên URL, payload CHỈ chứa "content", KHÔNG truyền "model" vào body
            var requestBody = new
            {
                content = new
                {
                    parts = new[]
                    {
                new { text = text }
            }
                }
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

            var valuesElement = doc.RootElement
                .GetProperty("embedding")
                .GetProperty("values");

            var vector = JsonSerializer.Deserialize<float[]>(valuesElement.GetRawText());
            return vector ?? Array.Empty<float>();
        }
        public async Task<string> GenerateCopilotAnswerAsync(
            string question,
            string? selectedText,
            int? currentPage,
            List<string> citations,
            CancellationToken ct = default)
        {
            // Danh sách các model tương thích theo thứ tự ưu tiên phản hồi nhanh và ổn định
            var modelsToTry = new[] { "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3-flash-preview", "gemini-3.8-flash" };

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
                    maxOutputTokens = 4096, // Tăng lên 4096 để AI viết thoải mái không bao giờ bị cụt
                    thinkingConfig = new
                    {
                        thinkingBudget = 0 // Đặt 0 để AI phản hồi tức thì và dành trọn token cho nội dung
                    }
                }
            };

            string lastError = string.Empty;

            // Thử lần lượt các model cho đến khi thành công (giới hạn 20s mỗi model để tránh treo 100s)
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

                            return text ?? "Không nhận được câu trả lời từ AI.";
                        }

                        return "AI không thể xử lý câu trả lời lúc này.";
                    }

                    lastError = $"[{model} - {(int)response.StatusCode}] {responseString}";

                    // Chỉ ném lỗi ngay với lỗi xác thực/payload (400/401/403), còn 404/429/500/503 thì fallback sang model tiếp theo
                    var statusCode = (int)response.StatusCode;
                    if (statusCode != 404 && statusCode != 429 && statusCode < 500)
                    {
                        throw new HttpRequestException($"Google API Generation error ({response.StatusCode}): {responseString}");
                    }
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                {
                    lastError = $"[{model}] Quá thời gian chờ (timeout 20s)";
                }
                catch (HttpRequestException ex)
                {
                    lastError = $"[{model}] {ex.Message}";
                }

                // Chờ ngắn trước khi thử model tiếp theo
                await Task.Delay(500, ct);
            }

            // 3. FALLBACK: Thử Local LLM (Ollama hoặc LM Studio) nếu tất cả mô hình Gemini đều bận/hết hạn ngạch
            try
            {
                var localLlmUrl = "http://localhost:11434/api/generate";
                var localPayload = new
                {
                    model = "llama3.2",
                    prompt = promptBuilder.ToString(),
                    stream = false
                };

                using var localContent = new StringContent(
                    JsonSerializer.Serialize(localPayload),
                    Encoding.UTF8,
                    "application/json"
                );

                using var localCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                localCts.CancelAfter(TimeSpan.FromSeconds(25));

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

            // 4. FALLBACK CUỐI CÙNG: Tổng hợp văn học dựa trên trích dẫn sách
            if (citations != null && citations.Count > 0)
            {
                var summary = string.Join("\n", citations.Take(2));
                return $"Dựa trên ngữ cảnh tác phẩm tại trang {currentPage ?? 1}:\n{summary}\n\n*(Ghi chú: Gemini và Local LLM hiện chưa phản hồi nên hệ thống trích xuất trực tiếp đoạn liên quan từ sách)*";
            }

            return $"Đã ghi nhận câu hỏi: \"{question}\" trên trang {currentPage ?? 1}. Hệ thống AI đang bận, vui lòng thử lại sau giây lát hoặc sử dụng Local LLM.";
        }
    }
}