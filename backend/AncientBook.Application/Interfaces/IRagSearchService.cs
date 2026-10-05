using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Common.Interfaces
{
    public interface IRagSearchService
    {
        Task<List<BookEmbedding>> SearchRelevantChunksAsync(int editionId, string userQuestion, CancellationToken ct = default);
    }
}