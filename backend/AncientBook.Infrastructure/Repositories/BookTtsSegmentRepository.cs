using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Interfaces;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class BookTtsSegmentRepository : IBookTtsSegmentRepository
    {
        private readonly ApplicationDbContext _context;

        public BookTtsSegmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<BookTtsSegment>> GetByEditionIdAsync(int editionId, CancellationToken ct = default)
        {
            return await _context.BookTtsSegments
                .Where(s => s.EditionId == editionId)
                .ToListAsync(ct);
        }

        public async Task<List<BookTtsSegment>> GetByEditionAndPageAsync(int editionId, int pageNumber, CancellationToken ct = default)
        {
            return await _context.BookTtsSegments
                .AsNoTracking()
                .Where(s => s.EditionId == editionId && s.PageNumber == pageNumber)
                .OrderBy(s => s.SegmentIndex)
                .ToListAsync(ct);
        }

        public async Task DeleteRangeAsync(IEnumerable<BookTtsSegment> segments, CancellationToken ct = default)
        {
            _context.BookTtsSegments.RemoveRange(segments);
            await _context.SaveChangesAsync(ct);
        }

        public async Task AddRangeAsync(IEnumerable<BookTtsSegment> segments, CancellationToken ct = default)
        {
            await _context.BookTtsSegments.AddRangeAsync(segments, ct);
        }

        public async Task SaveChangesAsync(CancellationToken ct = default)
        {
            await _context.SaveChangesAsync(ct);
        }
    }
}