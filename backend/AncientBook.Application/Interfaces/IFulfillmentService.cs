using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IFulfillmentService
    {
        Task<PagedResult<FulfillmentPendingItem>> GetPendingOrdersAsync(FulfillmentPendingQuery query);
        Task<FulfillmentDetailResponse> GetOrderDetailAsync(int orderId);
        Task<bool> ConfirmPackingAsync(int orderId, string staffUsername);
        Task<bool> ReportPackingIssueAsync(int orderId, string staffUsername, string reason);
    }
}
