using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IFPointService
    {
        Task<FPointBalanceDto> GetBalanceAsync(int userId);

        Task<PagedResult<FPointTransactionDto>> GetHistoryAsync(int userId, int pageNumber, int pageSize);

        // Chỉ xem trước mức giảm giá; Checkout kiểm tra lại và trừ điểm trong transaction.
        Task<UseFPointResponse> ValidateAndCalculatePointsAsync(int userId, UseFPointRequest request);

        Task<List<MembershipTierDto>> GetMembershipTiersAsync();

        // Xét nâng hạng theo tổng chi tiêu của các đơn hoàn thành, đã thanh toán.
        Task<bool> AutoUpgradeTierAsync(int userId, int orderId, decimal totalSpent);

        Task<bool> UpdateMembershipTierAsync(int id, MembershipTierDto dto, int? actorUserId = null);
        Task<int> AwardCompletedOrderAsync(int orderId);
        Task ProcessPaidDigitalOrderAsync(int orderId);
    }
}
