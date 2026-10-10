using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IFPointService
    {
        // UC22: Xem số dư điểm
        Task<FPointBalanceDto> GetBalanceAsync(int userId);

        // UC22: Xem lịch sử biến động điểm
        Task<PagedResult<FPointTransactionDto>> GetHistoryAsync(int userId, int pageNumber, int pageSize);

        // UC22: Sử dụng điểm khi checkout
        Task<UseFPointResponse> ValidateAndCalculatePointsAsync(int userId, UseFPointRequest request);

        // UC22: Lấy danh sách hạng thành viên
        Task<List<MembershipTierDto>> GetMembershipTiersAsync();

        // UC22: Tự động nâng hạng (gọi khi đơn Hoàn thành)
        Task<bool> AutoUpgradeTierAsync(int userId, int orderId, decimal totalSpent);
    }
}