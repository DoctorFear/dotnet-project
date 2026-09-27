using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IReportRepository
    {
        Task<int> CountBooksAsync();
        Task<int> CountSellingBooksAsync();
        Task<int> CountLowStockBooksAsync(int threshold);
        Task<decimal> GetTotalRevenueAsync();
        Task<List<TopSellingBookDto>> GetTopSellingBooksAsync(int take);
    }
}
