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
            // Assuming Inventory primary key or unique index matches BookId
            return await _context.Inventories.FindAsync(bookId);
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