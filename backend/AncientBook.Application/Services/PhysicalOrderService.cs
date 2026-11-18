using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public interface IPhysicalOrderService
    {
        Task<List<PhysicalOrderSummaryDto>> GetPhysicalOrdersAsync(string? status, string? searchKeyword);
        Task<PagedPhysicalOrdersResponseDto> GetPagedPhysicalOrdersAsync(int pageIndex, int pageSize, string? status, string? searchKeyword = null);
        Task<OrderTrackingDetailDto?> GetOrderTrackingAsync(int orderId);
        Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus);
    }

    public class PhysicalOrderService : IPhysicalOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IBookRepository _bookRepository;

        public PhysicalOrderService(
            IOrderRepository orderRepository,
            IUserRepository userRepository,
            IBookRepository bookRepository)
        {
            _orderRepository = orderRepository;
            _userRepository = userRepository;
            _bookRepository = bookRepository;
        }

        public async Task<List<PhysicalOrderSummaryDto>> GetPhysicalOrdersAsync(string? status, string? searchKeyword)
        {
            var orders = await _orderRepository.GetAllAsync();
            var users = await _userRepository.GetAllAsync();
            var userDict = users.ToDictionary(u => u.Id, u => u.FullName);

            var query = orders.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status.ToString().Equals(status.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(searchKeyword))
            {
                var keyword = searchKeyword.Trim();
                query = query.Where(o =>
                    o.Id.ToString().Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                    $"ORD-{o.Id:D8}".Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                    o.ShippingAddress.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                    (userDict.ContainsKey(o.UserId) && userDict[o.UserId].Contains(keyword, StringComparison.OrdinalIgnoreCase)));
            }

            return query.OrderByDescending(o => o.OrderDate)
                .Select(o => new PhysicalOrderSummaryDto
                {
                    OrderId = o.Id,
                    OrderCode = $"ORD-{o.Id:D8}",
                    CustomerName = userDict.ContainsKey(o.UserId) ? userDict[o.UserId] : "Khách hàng",
                    OrderDate = o.OrderDate,
                    FinalAmount = o.FinalAmount,
                    ShippingAddress = o.ShippingAddress,
                    Status = o.Status.ToString(),
                    IsPaid = o.IsPaid,
                    ShipperId = o.ShipperId,
                    ShipperName = o.Shipper?.Name
                }).ToList();
        }

        public async Task<PagedPhysicalOrdersResponseDto> GetPagedPhysicalOrdersAsync(int pageIndex, int pageSize, string? status, string? searchKeyword = null)
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;

            var filtered = await GetPhysicalOrdersAsync(status, searchKeyword);
            return new PagedPhysicalOrdersResponseDto
            {
                TotalCount = filtered.Count,
                PageIndex = pageIndex,
                PageSize = pageSize,
                Items = filtered.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList()
            };
        }

        public async Task<OrderTrackingDetailDto?> GetOrderTrackingAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return null;

            var books = await _bookRepository.GetAllAsync();
            var bookDict = books.ToDictionary(b => b.Id, b => b);

            var items = order.OrderItems.Select(i => new PhysicalOrderItemDto
            {
                BookId = i.BookId,
                BookTitle = bookDict.ContainsKey(i.BookId) ? bookDict[i.BookId].Title : string.Empty,
                CoverImg = bookDict.ContainsKey(i.BookId) ? (bookDict[i.BookId].CoverImg ?? string.Empty) : string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList();

            return new OrderTrackingDetailDto
            {
                OrderId = order.Id,
                OrderCode = $"ORD-{order.Id:D8}",
                OrderDate = order.OrderDate,
                Status = order.Status.ToString(),
                ShippingAddress = order.ShippingAddress,
                SubTotal = order.SubTotal,
                DiscountAmount = order.DiscountAmount,
                FinalAmount = order.FinalAmount,
                IsPaid = order.IsPaid,
                ShipperId = order.ShipperId,
                ShipperName = order.Shipper?.Name,
                ShipperPhone = order.Shipper?.Phone,
                Items = items,
                Timeline = BuildOrderTimeline(order)
            };
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return false;

            if (!Enum.TryParse<OrderStatus>(newStatus?.Trim(), ignoreCase: true, out var parsedStatus))
            {
                throw new InvalidOperationException($"Trạng thái đơn hàng '{newStatus}' không hợp lệ.");
            }

            order.Status = parsedStatus;
            if (parsedStatus == OrderStatus.Completed)
            {
                order.IsPaid = true;
            }

            _orderRepository.Update(order);
            await _orderRepository.SaveChangesAsync();
            return true;
        }

        private static List<OrderTimelineStepDto> BuildOrderTimeline(Order order)
        {
            var standardSteps = new (OrderStatus Status, string Title, string Description)[]
            {
                (OrderStatus.Pending, "Chờ xác nhận", "Đơn hàng đã được tiếp nhận và đang chờ xác nhận."),
                (OrderStatus.Confirmed, "Đã xác nhận", "Đơn hàng đã được xác nhận, đang chuyển xuống kho."),
                (OrderStatus.Prepared, "Đã chuẩn bị xong", "Kho đã đóng gói xong và chờ bàn giao cho Shipper."),
                (OrderStatus.Shipping, "Đang giao hàng", "Shipper đang trên đường giao đơn hàng đến địa chỉ nhận."),
                (OrderStatus.Completed, "Hoàn thành", "Giao hàng và thanh toán thành công.")
            };

            var timeline = new List<OrderTimelineStepDto>();
            int currentOrderValue = (int)order.Status;

            foreach (var step in standardSteps)
            {
                int stepVal = (int)step.Status;
                bool isCompleted = order.Status != OrderStatus.Failed && currentOrderValue >= stepVal;
                bool isCurrent = order.Status == step.Status;

                timeline.Add(new OrderTimelineStepDto
                {
                    StepCode = step.Status.ToString(),
                    Title = step.Title,
                    Description = step.Description,
                    IsCompleted = isCompleted,
                    IsCurrent = isCurrent,
                    Timestamp = step.Status == OrderStatus.Pending
                        ? order.OrderDate
                        : (isCurrent ? (order.UpdatedAt ?? order.OrderDate) : null)
                });
            }

            if (order.Status == OrderStatus.Failed)
            {
                timeline.Add(new OrderTimelineStepDto
                {
                    StepCode = OrderStatus.Failed.ToString(),
                    Title = "Đã hủy / Giao thất bại",
                    Description = "Đơn hàng đã bị hủy hoặc giao không thành công.",
                    IsCompleted = true,
                    IsCurrent = true,
                    Timestamp = order.UpdatedAt ?? order.OrderDate
                });
            }
            else if (order.Status == OrderStatus.ReturnRequested ||
                     order.Status == OrderStatus.ReturnApproved ||
                     order.Status == OrderStatus.Returned)
            {
                timeline.Add(new OrderTimelineStepDto
                {
                    StepCode = order.Status.ToString(),
                    Title = order.Status switch
                    {
                        OrderStatus.ReturnRequested => "Chờ duyệt hoàn trả",
                        OrderStatus.ReturnApproved => "Đã duyệt hoàn trả - Chờ thu hồi",
                        OrderStatus.Returned => "Đã hoàn trả thành công",
                        _ => order.Status.ToString()
                    },
                    Description = "Tiến trình xử lý yêu cầu hoàn trả đơn hàng vật lý.",
                    IsCompleted = true,
                    IsCurrent = true,
                    Timestamp = order.UpdatedAt ?? order.OrderDate
                });
            }

            return timeline;
        }
    }
}
