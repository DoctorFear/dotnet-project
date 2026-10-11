using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IDeliveryService
    {
        // UC19: Shipper xem danh sách đơn được phân công
        Task<PagedResult<DeliveryOrderSummaryDto>> GetMyDeliveriesAsync(int shipperUserId, DeliveryOrderQuery query);

        // UC19: Shipper xem chi tiết đơn
        Task<DeliveryOrderDetailDto> GetDeliveryDetailAsync(int orderId, int shipperUserId);

        // UC19: Shipper cập nhật trạng thái
        Task<bool> UpdateDeliveryStatusAsync(int orderId, int shipperUserId, UpdateDeliveryStatusRequest request);

        // UC19: Lấy danh sách lý do giao thất bại
        Task<List<FailureReasonDto>> GetFailureReasonsAsync();
        Task LinkShipperAccountAsync(int shipperId, int userId, int actorId);
    }
}
