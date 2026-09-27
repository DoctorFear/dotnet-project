using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Interfaces
{
    public interface IOrderService
    {
        Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string? updatedBy = null);
        Task<bool> CancelOrder(int orderId);
        Task<bool> RequestRefundOrder(int orderId);
        Task<PagedResult<Order>> GetPagedOrdersAsync(GetOrdersQuery query);
        Task<bool> ApproveReturnOrderAsync(int orderId, string adminUser);
    }
}