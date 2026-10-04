using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IInventoryRepository
    {
        Task<Inventory?> GetByBookIdAsync(int bookId);
        Task<bool> DecreaseStockAsync(int bookId, int quantity);
        Task<bool> IncreaseStockAsync(int bookId, int quantity);
        Task<List<Inventory>> GetAllAsync(); 
        Task UpdateAsync(Inventory inventory);
    }
}