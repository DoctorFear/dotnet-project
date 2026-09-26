using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class ReportRepository : IReportRepository
    {
        private readonly ApplicationDbContext _context;

        public ReportRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public Task<int> CountBooksAsync()
        {
            return _context.Books.CountAsync();
        }

        public Task<int> CountSellingBooksAsync()
        {
            return _context.Books.CountAsync(book => book.Status == BookStatus.Selling);
        }

        public Task<int> CountLowStockBooksAsync(int threshold)
        {
            return _context.Books.CountAsync(book => book.StockCount <= threshold);
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            return await _context.Orders
                .Where(order => order.IsPaid && order.Status != OrderStatus.Returned)
                .Select(order => (decimal?)order.FinalAmount)
                .SumAsync() ?? 0;
        }

        public Task<List<TopSellingBookDto>> GetTopSellingBooksAsync(int take)
        {
            return _context.OrderItems
                .GroupBy(orderItem => new { orderItem.BookId, orderItem.Book!.Title })
                .Select(group => new TopSellingBookDto
                {
                    BookId = group.Key.BookId,
                    Title = group.Key.Title,
                    SoldQuantity = group.Sum(orderItem => orderItem.Quantity),
                    TotalAmount = group.Sum(orderItem => orderItem.UnitPrice * orderItem.Quantity)
                })
                .OrderByDescending(book => book.SoldQuantity)
                .Take(take)
                .ToListAsync();
        }
    }
}
