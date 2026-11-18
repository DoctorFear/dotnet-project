using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly ApplicationDbContext _context;

        public InventoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Inventory?> GetByBookIdAsync(int bookId)
        {
            return await _context.Inventories.FirstOrDefaultAsync(i => i.BookId == bookId);
        }

        public async Task<List<Inventory>> GetAllAsync()
        {
            return await _context.Inventories.AsNoTracking().ToListAsync();
        }

        public async Task AddAsync(Inventory inventory)
        {
            await _context.Inventories.AddAsync(inventory);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Inventory inventory)
        {
            _context.Inventories.Update(inventory);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DecreaseStockAsync(int bookId, int quantity)
        {
            var now = TimeZoneHelper.GetVietnamTime();
            int rowsAffected = await _context.Inventories
                .Where(i => i.BookId == bookId && i.QuantityOnHand >= quantity)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.QuantityOnHand, i => i.QuantityOnHand - quantity)
                    .SetProperty(i => i.LastUpdated, now)
                );

            if (rowsAffected > 0)
            {
                await _context.Books
                    .Where(b => b.Id == bookId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(b => b.StockCount, b => b.StockCount >= quantity ? b.StockCount - quantity : 0)
                        .SetProperty(b => b.StockStatus, b => (b.StockCount - quantity) <= 0 ? StockStatus.OutOfStock : StockStatus.InStock)
                    );
            }

            return rowsAffected > 0;
        }

        public async Task<bool> IncreaseStockAsync(int bookId, int quantity)
        {
            var now = TimeZoneHelper.GetVietnamTime();
            int rowsAffected = await _context.Inventories
                .Where(i => i.BookId == bookId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.QuantityOnHand, i => i.QuantityOnHand + quantity)
                    .SetProperty(i => i.LastUpdated, now)
                );

            await _context.Books
                .Where(b => b.Id == bookId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(b => b.StockCount, b => b.StockCount + quantity)
                    .SetProperty(b => b.StockStatus, b => (b.StockCount + quantity) > 0 ? StockStatus.InStock : StockStatus.OutOfStock)
                );

            return rowsAffected > 0;
        }
    }
}