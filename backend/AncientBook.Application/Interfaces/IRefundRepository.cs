using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces
{
    public interface IRefundRepository
    {
        Task<Refund?> GetByOrderIdAsync(int orderId);
        Task AddAsync(Refund refund);
        Task<(List<RefundResponseDto> Items, int TotalCount)> GetPagedRefundsAsync(GetRefundsQuery query);
    }
}