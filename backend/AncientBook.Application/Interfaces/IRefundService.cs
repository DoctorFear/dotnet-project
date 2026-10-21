using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces
{
    public interface IRefundService
    {
        Task<bool> SubmitRefundRequestAsync(RefundRequestDto request, int userId);
        Task<RefundResponseDto?> GetRefundByOrderIdAsync(int orderId, int userId, string userRole);
        Task<PagedResult<RefundResponseDto>> GetPagedRefundsAsync(GetRefundsQuery query);
    }
}