using System.Threading;
using System.Threading.Tasks;

namespace AncientBook.Application.Common.Interfaces
{
    public interface IGeminiEmbeddingService
    {
        Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct = default);

        Task<string> GenerateCopilotAnswerAsync(
            string question,
            string? selectedText,
            int? currentPage,
            List<string> citations,
            CancellationToken ct = default);
    }
}