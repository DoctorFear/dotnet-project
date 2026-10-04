using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IStockAlertRepository
    {
        Task<List<StockAlert>> GetActiveAlertsAsync();
        Task<StockAlert?> GetByBookIdAsync(int bookId);
        Task<StockAlert?> GetByIdAsync(int id);
        Task AddAsync(StockAlert alert);
        Task AddRangeAsync(IEnumerable<StockAlert> alerts);
    }
}
