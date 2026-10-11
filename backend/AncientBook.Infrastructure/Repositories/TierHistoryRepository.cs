using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;

namespace AncientBook.Infrastructure.Repositories
{
    public class TierHistoryRepository : ITierHistoryRepository
    {
        private readonly ApplicationDbContext _context;

        public TierHistoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(TierHistory history)
        {
            await _context.TierHistories.AddAsync(history);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}