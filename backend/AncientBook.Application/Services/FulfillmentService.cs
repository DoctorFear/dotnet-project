using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class FulfillmentService : IFulfillmentService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ILogger<FulfillmentService> _logger;

        public FulfillmentService(
            IOrderRepository orderRepository,
            ILogger<FulfillmentService> logger)
        {
            _orderRepository = orderRepository;
            _logger = logger;
        }

        // ============================================================
        // UC18: Lấy danh sách đơn "Đã xác nhận" cần đóng gói
        // ============================================================
        public async Task<PagedResult<FulfillmentPendingItem>> GetPendingOrdersAsync(FulfillmentPendingQuery query)
        {
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1) query.PageSize = 10;
            if (query.PageSize > 100) query.PageSize = 100;

            // Dùng overload 3-param (signature MỚI của nhóm)
            var (items, totalCount) = await _orderRepository.GetPagedOrdersAsync(
                query.PageNumber,
                query.PageSize,
                OrderStatus.Confirmed.ToString());

            var result = items.Select(o => new FulfillmentPendingItem
            {
                OrderId = o.Id,
                CustomerName = o.User?.FullName ?? "N/A",
                OrderDate = o.OrderDate,
                TotalItems = o.OrderItems?.Sum(oi => oi.Quantity) ?? 0,
                FinalAmount = o.FinalAmount,
                Status = o.Status
            }).ToList();

            return new PagedResult<FulfillmentPendingItem>(result, totalCount, query.PageNumber, query.PageSize);
        }

        // ============================================================
        // UC18: Lấy chi tiết đơn để đóng gói
        // ============================================================
        public async Task<FulfillmentDetailResponse> GetOrderDetailAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.Status != OrderStatus.Confirmed)
            {
                throw new InvalidOperationException($"Đơn hàng không ở trạng thái 'Đã xác nhận' (hiện tại: {order.Status}).");
            }

            var response = new FulfillmentDetailResponse
            {
                OrderId = order.Id,
                CustomerName = order.User?.FullName ?? "N/A",
                ShippingAddress = order.ShippingAddress,
                ReceiverPhone = order.User?.PhoneNumber,
                Items = order.OrderItems?.Select(oi => new FulfillmentItemDetail
                {
                    BookId = oi.BookId,
                    BookTitle = oi.Book?.Title ?? "N/A",
                    BookCover = oi.Book?.CoverImg,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList() ?? new List<FulfillmentItemDetail>()
            };

            return response;
        }

        // ============================================================
        // UC18: Xác nhận đóng gói xong → Chuyển Confirmed → Prepared
        // ============================================================
        public async Task<bool> ConfirmPackingAsync(int orderId, string staffUsername)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.Status != OrderStatus.Confirmed)
            {
                throw new InvalidOperationException($"Đơn hàng không ở trạng thái 'Đã xác nhận'. Trạng thái hiện tại: {order.Status}.");
            }

            var previousStatus = order.Status;
            order.Status = OrderStatus.Prepared;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = staffUsername;

            await _orderRepository.UpdateAsync(order);

            _logger.LogInformation(
                "Staff {Staff} đã đóng gói xong đơn hàng #{OrderId}. Trạng thái: {OldStatus} → {NewStatus}",
                staffUsername, orderId, previousStatus, order.Status);

            return true;
        }
    }
}