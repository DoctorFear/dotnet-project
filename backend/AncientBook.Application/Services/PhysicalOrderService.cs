using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;

namespace AncientBook.Application.Services
{
    public interface IPhysicalOrderService
    {
        Task<List<PhysicalOrderSummaryDto>> GetPhysicalOrdersAsync(string? status, string? searchKeyword);
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
                query = query.Where(o => o.Status.ToString().Equals(status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(searchKeyword))
            {
                query = query.Where(o => o.Id.ToString().Contains(searchKeyword)
                                      || o.ShippingAddress.Contains(searchKeyword));
            }

            return query.OrderByDescending(o => o.OrderDate)
                .Select(o => new PhysicalOrderSummaryDto
                {
                    OrderId = o.Id,
                    OrderCode = $"ORD-{o.Id.ToString().Substring(0, 8).ToUpper()}",
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
                CoverImg = bookDict.ContainsKey(i.BookId) ? bookDict[i.BookId].CoverImg : string.Empty, // Đã đổi sang CoverImg
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList();

            return new OrderTrackingDetailDto
            {
                OrderId = order.Id,
                OrderCode = $"ORD-{order.Id.ToString().Substring(0, 8).ToUpper()}",
                OrderDate = order.OrderDate,
                Status = order.Status.ToString(),
                ShippingAddress = order.ShippingAddress,
                SubTotal = order.SubTotal,
                DiscountAmount = order.DiscountAmount,
                FinalAmount = order.FinalAmount,
                IsPaid = order.IsPaid,
                ShipperName = order.Shipper?.Name,
                ShipperPhone = order.Shipper?.Phone,
                Items = items
            };
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return false;

            _orderRepository.Update(order);
            await _orderRepository.SaveChangesAsync();
            return true;
        }
    }
}
