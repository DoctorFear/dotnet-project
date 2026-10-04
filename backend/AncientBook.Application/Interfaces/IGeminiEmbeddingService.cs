using System.Threading;
using System.Threading.Tasks;

namespace AncientBook.Application.Common.Interfaces
{
    public interface IGeminiEmbeddingService
    {
        Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct = default);
    }
}