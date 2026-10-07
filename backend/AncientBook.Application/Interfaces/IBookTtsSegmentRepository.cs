using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Domain.Interfaces
{
    public interface IBookTtsSegmentRepository
    {
        Task<List<BookTtsSegment>> GetByEditionIdAsync(int editionId, CancellationToken ct = default);
        Task<List<BookTtsSegment>> GetByEditionAndPageAsync(int editionId, int pageNumber, CancellationToken ct = default);
        Task DeleteRangeAsync(IEnumerable<BookTtsSegment> segments, CancellationToken ct = default);
        Task AddRangeAsync(IEnumerable<BookTtsSegment> segments, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}