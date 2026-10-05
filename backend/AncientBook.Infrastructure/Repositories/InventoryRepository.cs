using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
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

        public async Task UpdateAsync(Inventory inventory)
        {
            _context.Inventories.Update(inventory);
            await _context.SaveChangesAsync();
        }
        public async Task<bool> DecreaseStockAsync(int bookId, int quantity)
        {
            int rowsAffected = await _context.Inventories
                .Where(i => i.BookId == bookId && i.QuantityOnHand >= quantity)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    i => i.QuantityOnHand, 
                    i => i.QuantityOnHand - quantity
                ));
            rowsAffected += await _context.Books
                .Where(i => i.Id == bookId && i.StockStatus != StockStatus.OutOfStock && i.StockCount >= quantity )
                .ExecuteUpdateAsync(s => s.SetProperty(
                    i => i.StockCount,
                    i => i.StockCount - quantity
                ));

            return rowsAffected > 0;
        }

        public async Task<bool> IncreaseStockAsync(int bookId, int quantity)
        {
            int rowsAffected = await _context.Inventories
                .Where(i => i.BookId == bookId)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    i => i.QuantityOnHand, 
                    i => i.QuantityOnHand + quantity
                ));
            rowsAffected += await _context.Books
                .Where(i => i.Id == bookId && i.StockStatus != StockStatus.OutOfStock && i.StockCount >= quantity )
                .ExecuteUpdateAsync(s => s.SetProperty(
                    i => i.StockCount,
                    i => i.StockCount + quantity
                ));

            return rowsAffected > 0;
        }
    }
}