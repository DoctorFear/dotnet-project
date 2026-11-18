using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IStockMovementRepository
    {
        Task<List<StockMovement>> GetAllAsync(int? bookId = null, string? movementType = null);
        Task AddAsync(StockMovement movement);
        Task AddRangeAsync(IEnumerable<StockMovement> movements);
        Task SaveChangesAsync();
    }
}
