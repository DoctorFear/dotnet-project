using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class BookEmbeddingRepository : IBookEmbeddingRepository
    {
        private readonly ApplicationDbContext _context;

        public BookEmbeddingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddRangeAsync(IEnumerable<BookEmbedding> embeddings, CancellationToken ct = default)
        {
            await _context.BookEmbeddings.AddRangeAsync(embeddings, ct);
        }

        public async Task<List<BookEmbedding>> GetByEditionIdAsync(int editionId, CancellationToken ct = default)
        {
            return await _context.BookEmbeddings
                .Where(b => b.EditionId == editionId)
                .ToListAsync(ct);
        }

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            return await _context.SaveChangesAsync(ct);
        }
    }
}