using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Application.DTOs;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task AddAsync(Order order)
        {
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Order order)
        {
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> UpdateStatusAsync(int orderId, OrderStatus newStatus)
        {
            int rowsAffected = await _context.Orders
                .Where(o => o.Id == orderId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.Status, newStatus)
                    .SetProperty(o => o.UpdatedAt, TimeZoneHelper.GetVietnamTime())
                );

            return rowsAffected > 0;
        }

        public async Task<(List<Order> Items, int TotalCount)> GetPagedOrdersAsync(GetOrdersQuery query)
        {
            var dbQuery = _context.Orders
                .Include(o => o.OrderItems)
                .AsQueryable();

            if (query.UserId.HasValue)
            {
                dbQuery = dbQuery.Where(o => o.UserId == query.UserId.Value);
            }

            if (query.Status.HasValue)
            {
                dbQuery = dbQuery.Where(o => o.Status == query.Status.Value);
            }

            int totalCount = await dbQuery.CountAsync();

            var items = await dbQuery
                .OrderByDescending(o => o.OrderDate)
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}