using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Common.Interfaces.Repositories
{
    public interface IBookEmbeddingRepository
    {
        Task AddRangeAsync(IEnumerable<BookEmbedding> embeddings, CancellationToken ct = default);
        Task<List<BookEmbedding>> GetByEditionIdAsync(int editionId, CancellationToken ct = default);
        Task<int> SaveChangesAsync(CancellationToken ct = default);
    }
}