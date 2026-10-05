using System.Threading;
using System.Threading.Tasks;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class EbookEditionRepository : IEbookEditionRepository
    {
        private readonly ApplicationDbContext _context;

        public EbookEditionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EbookEdition?> GetByIdWithBookAsync(int editionId, CancellationToken ct = default)
        {
            return await _context.EbookEditions
                .Include(e => e.Book)
                .FirstOrDefaultAsync(e => e.Id == editionId, ct);
        }

        public async Task<EbookEdition?> GetByIdAsync(int editionId, CancellationToken ct = default)
        {
            return await _context.EbookEditions
                .FirstOrDefaultAsync(e => e.Id == editionId, ct);
        }
        public async Task AddAsync(EbookEdition edition, CancellationToken ct = default)
        {
            await _context.EbookEditions.AddAsync(edition, ct);
        }

        public void Update(EbookEdition edition)
        {
            _context.EbookEditions.Update(edition);
        }

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            return await _context.SaveChangesAsync(ct);
        }
    }
}