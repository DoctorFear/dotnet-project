using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums; // Hoặc namespace chứa enum OrderStatus
using AncientBook.Application.DTOs; // Hoặc AncientBook.Application.Features.Orders.Queries (nơi chứa GetOrdersQuery)

namespace AncientBook.Infrastructure.Persistence.Repositories
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
                .Include(o => o.Shipper)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<List<Order>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.Shipper)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Order>> GetByShipperIdAsync(int shipperId)
        {
            return await _context.Orders
                .Where(o => o.ShipperId == shipperId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task AddAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
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

        public void Update(Order order)
        {
            _context.Orders.Update(order);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<(List<Order> items, int totalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? status)
        {
            var query = _context.Orders.Include(o => o.OrderItems).AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status.ToString() == status);
            }

            int totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
        
        public async Task<(List<Order> Items, int TotalCount)> GetPagedOrdersAsync(GetOrdersQuery query)
        {
            var dbQuery = _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.User)
                .AsQueryable();

            if (query.UserId.HasValue)
            {
                dbQuery = dbQuery.Where(o => o.UserId == query.UserId.Value);
            }

            if (query.Status.HasValue)
            {
                dbQuery = dbQuery.Where(o => o.Status == query.Status.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            {
                var keyword = query.SearchKeyword.Trim().ToLower();
                dbQuery = dbQuery.Where(o => 
                    (o.User != null && (o.User.Username.ToLower().Contains(keyword) || 
                                        o.User.Email.ToLower().Contains(keyword) || 
                                        o.User.FullName.ToLower().Contains(keyword))) ||
                    o.Id.ToString() == keyword
                );
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
