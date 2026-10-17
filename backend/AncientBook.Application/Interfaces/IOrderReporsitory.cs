using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(int id);
        Task<List<Order>> GetAllAsync();
        Task<List<Order>> GetByShipperIdAsync(int shipperId);
        Task AddAsync(Order order);
        Task UpdateAsync(Order order);
        void Update(Order order);
        Task SaveChangesAsync();
        // Task<(List<OrderResponseDto> items, int totalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? status, int? userId, string? SearchKeyword);
        Task<(List<OrderResponseDto> Items, int TotalCount)> GetPagedOrdersAsync(GetOrdersQuery query);
        Task<OrderResponseDto?> GetOrderDtoByIdAsync(int id);
    }
}
