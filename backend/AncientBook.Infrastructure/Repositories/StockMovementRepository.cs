using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class StockMovementRepository : IStockMovementRepository
    {
        private readonly ApplicationDbContext _context;

        public StockMovementRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StockMovement>> GetAllAsync(int? bookId = null, string? movementType = null)
        {
            var query = _context.StockMovements.AsNoTracking().AsQueryable();

            if (bookId.HasValue)
            {
                query = query.Where(sm => sm.BookId == bookId.Value);
            }

            if (!string.IsNullOrWhiteSpace(movementType))
            {
                var normalized = movementType.Trim().ToLower();
                query = query.Where(sm => sm.MovementType.ToLower() == normalized);
            }

            return await query
                .OrderByDescending(sm => sm.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(StockMovement movement)
        {
            await _context.StockMovements.AddAsync(movement);
        }

        public async Task AddRangeAsync(IEnumerable<StockMovement> movements)
        {
            await _context.StockMovements.AddRangeAsync(movements);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
