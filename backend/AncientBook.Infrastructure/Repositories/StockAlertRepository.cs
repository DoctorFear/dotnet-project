using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class StockAlertRepository : IStockAlertRepository
    {
        private readonly ApplicationDbContext _context;

        public StockAlertRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StockAlert>> GetActiveAlertsAsync()
        {
            return await _context.StockAlerts
                .AsNoTracking()
                .Where(a => !a.IsResolved)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<StockAlert?> GetByBookIdAsync(int bookId)
        {
            return await _context.StockAlerts
                .FirstOrDefaultAsync(a => a.BookId == bookId && !a.IsResolved);
        }

        public async Task<StockAlert?> GetByIdAsync(int id)
        {
            return await _context.StockAlerts.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task AddAsync(StockAlert alert)
        {
            await _context.StockAlerts.AddAsync(alert);
        }

        public async Task AddRangeAsync(IEnumerable<StockAlert> alerts)
        {
            await _context.StockAlerts.AddRangeAsync(alerts);
        }
    }
}
