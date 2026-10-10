using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class DeliveryService : IDeliveryService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IUserRepository _userRepository;
        private readonly IApplicationDbContext _context;        // ✅ THÊM: Để query LINQ trực tiếp
        private readonly ILogger<DeliveryService> _logger;

        public DeliveryService(
            IOrderRepository orderRepository,
            IInventoryRepository inventoryRepository,
            IUserRepository userRepository,
            IApplicationDbContext context,                       // ✅ THÊM
            ILogger<DeliveryService> logger)
        {
            _orderRepository = orderRepository;
            _inventoryRepository = inventoryRepository;
            _userRepository = userRepository;
            _context = context;                                  // ✅ THÊM
            _logger = logger;
        }

        // ============================================================
        // UC19: Shipper xem danh sách đơn được phân công
        // ✅ NHIỆM VỤ 2: AsNoTracking + Eager Loading + Filter ở DB level
        // ============================================================
        public async Task<PagedResult<DeliveryOrderSummaryDto>> GetMyDeliveriesAsync(
            int shipperUserId, DeliveryOrderQuery query)
        {
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1) query.PageSize = 10;
            if (query.PageSize > 100) query.PageSize = 100;

            // ✅ Query ở DB level với AsNoTracking + Eager Loading
            var dbQuery = _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.Shipper)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Where(o => o.ShipperId == shipperUserId);

            // ✅ Filter theo Status (ở DB level)
            if (!string.IsNullOrWhiteSpace(query.Status) &&
                Enum.TryParse<OrderStatus>(query.Status, out var statusEnum))
            {
                dbQuery = dbQuery.Where(o => o.Status == statusEnum);
            }

            // ✅ Filter theo Keyword (mã đơn HOẶC tên khách HOẶC SĐT) — theo UC Shipper A3
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                var kw = query.Keyword.Trim().ToLower();
                dbQuery = dbQuery.Where(o =>
                    o.Id.ToString().Contains(kw) ||
                    (o.User != null && o.User.FullName != null && o.User.FullName.ToLower().Contains(kw)) ||
                    (o.User != null && o.User.PhoneNumber != null && o.User.PhoneNumber.Contains(kw)));
            }

            // ✅ Đếm tổng ở DB level
            var totalCount = await dbQuery.CountAsync();

            // ✅ Sắp xếp theo UC Shipper BR01:
            // - Đơn chưa hoàn tất (Prepared, Shipping) lên trên
            // - Đơn kết thúc (Completed, Failed) xuống dưới
            // - Trong mỗi nhóm, đơn mới nhất lên đầu
            var items = await dbQuery
                .OrderBy(o => (o.Status == OrderStatus.Completed || o.Status == OrderStatus.Failed) ? 1 : 0)
                .ThenByDescending(o => o.OrderDate)
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(o => new DeliveryOrderSummaryDto
                {
                    OrderId = o.Id,
                    OrderCode = $"ORD-{o.Id}",
                    CustomerName = o.User != null ? (o.User.FullName ?? "N/A") : "N/A",
                    ShippingAddress = o.ShippingAddress,
                    ReceiverPhone = o.User != null ? o.User.PhoneNumber : null,
                    FinalAmount = o.FinalAmount,
                    CodAmount = o.IsPaid ? 0 : o.FinalAmount,
                    IsPaid = o.IsPaid,
                    Status = o.Status.ToString(),
                    OrderDate = o.OrderDate
                })
                .ToListAsync();

            return new PagedResult<DeliveryOrderSummaryDto>(
                items, totalCount, query.PageNumber, query.PageSize);
        }

        // ============================================================
        // UC19: Shipper xem chi tiết đơn
        // ✅ NHIỆM VỤ 2: AsNoTracking + Eager Loading đầy đủ
        // ============================================================
        public async Task<DeliveryOrderDetailDto> GetDeliveryDetailAsync(int orderId, int shipperUserId)
        {
            // ✅ Dùng LINQ trực tiếp với AsNoTracking + Eager Loading đầy đủ
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.Shipper)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.ShipperId != shipperUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem đơn hàng này.");
            }

            return new DeliveryOrderDetailDto
            {
                OrderId = order.Id,
                OrderCode = $"ORD-{order.Id}",
                CustomerName = order.User?.FullName ?? "N/A",
                ReceiverPhone = order.User?.PhoneNumber,
                ShippingAddress = order.ShippingAddress,
                OrderDate = order.OrderDate,
                Status = order.Status.ToString(),
                IsPaid = order.IsPaid,
                FinalAmount = order.FinalAmount,
                CodAmount = order.IsPaid ? 0 : order.FinalAmount,
                Items = order.OrderItems?.Select(oi => new DeliveryItemDto
                {
                    BookId = oi.BookId,
                    BookTitle = oi.Book?.Title ?? "N/A",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList() ?? new List<DeliveryItemDto>()
            };
        }

        // ============================================================
        // UC19: Shipper cập nhật trạng thái
        // ⚠️ GIỮ NGUYÊN — Không sửa (sẽ làm ở hạng mục 4)
        // ============================================================
        public async Task<bool> UpdateDeliveryStatusAsync(
            int orderId, int shipperUserId, UpdateDeliveryStatusRequest request)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.ShipperId != shipperUserId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn hàng này.");
            }

            var previousStatus = order.Status;

            if (!Enum.TryParse<OrderStatus>(request.NewStatus, out var newStatus))
            {
                throw new InvalidOperationException($"Trạng thái không hợp lệ: {request.NewStatus}");
            }

            // BR01: State machine validation
            var validTransition = (previousStatus, newStatus) switch
            {
                (OrderStatus.Prepared, OrderStatus.Shipping) => true,
                (OrderStatus.Shipping, OrderStatus.Completed) => true,
                (OrderStatus.Shipping, OrderStatus.Failed) => true,
                _ => false
            };

            if (!validTransition)
            {
                throw new InvalidOperationException($"Không thể chuyển từ {previousStatus} sang {newStatus}.");
            }

            // BR02: Nếu thất bại, bắt buộc chọn lý do
            if (newStatus == OrderStatus.Failed)
            {
                if (!request.FailureReasonId.HasValue)
                {
                    throw new InvalidOperationException("Vui lòng chọn lý do giao thất bại!");
                }

                // BR05: Hoàn kho
                if (order.OrderItems != null)
                {
                    foreach (var item in order.OrderItems)
                    {
                        if (item.PurchaseType == PurchaseType.Physical)
                        {
                            await _inventoryRepository.IncreaseStockAsync(item.BookId, item.Quantity);
                        }
                    }
                }
            }

            order.Status = newStatus;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = $"Shipper-{shipperUserId}";

            await _orderRepository.UpdateAsync(order);

            _logger.LogInformation(
                "Shipper #{ShipperId} đã cập nhật đơn #{OrderId}: {OldStatus} → {NewStatus}",
                shipperUserId, orderId, previousStatus, newStatus);

            return true;
        }

        // ============================================================
        // UC19: Lấy danh sách lý do giao thất bại
        // ⚠️ GIỮ NGUYÊN — Chưa implement (sẽ làm ở hạng mục 4)
        // ============================================================
        public async Task<List<FailureReasonDto>> GetFailureReasonsAsync()
        {
            // TODO: Implement ở hạng mục 4 (Logic nghiệp vụ UC19)
            // Hiện tại return empty list để không phá vỡ logic
            return await Task.FromResult(new List<FailureReasonDto>());
        }
    }
}