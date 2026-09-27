using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(int id);
        Task AddAsync(Order order);
        Task UpdateAsync(Order order);
        Task<(List<Order> Items, int TotalCount)> GetPagedOrdersAsync(GetOrdersQuery query);
        Task<bool> UpdateStatusAsync(int orderId, OrderStatus newStatus);
    }
}