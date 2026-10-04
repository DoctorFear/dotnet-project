using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
    public interface IShipperService
    {
        Task<List<ShipperDto>> GetAllShippersAsync();
        Task<List<PhysicalOrderSummaryDto>> GetOrdersByShipperAsync(int shipperId);
        Task<bool> AssignOrderToShipperAsync(AssignShipperDto dto);
        Task<bool> UnassignOrderAsync(int orderId);
        Task<bool> CreateShipperAsync(ShipperDto dto);
    }

    public class ShipperService : IShipperService
    {
        private readonly IShipperRepository _shipperRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IUserRepository _userRepository;

        public ShipperService(
            IShipperRepository shipperRepository,
            IOrderRepository orderRepository,
            IUserRepository userRepository)
        {
            _shipperRepository = shipperRepository;
            _orderRepository = orderRepository;
            _userRepository = userRepository;
        }

        public async Task<List<ShipperDto>> GetAllShippersAsync()
        {
            var shippers = await _shipperRepository.GetAllAsync();
            var allOrders = await _orderRepository.GetAllAsync();

            return shippers.Select(s => new ShipperDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                Area = s.Area,
                Status = s.Status,
                MaxConcurrentOrders = s.MaxConcurrentOrders,
                ActiveOrdersCount = allOrders.Count(o => o.ShipperId.HasValue && o.ShipperId.Value == s.Id && o.Status.ToString() == "Delivering")
            }).ToList();
        }

        public async Task<List<PhysicalOrderSummaryDto>> GetOrdersByShipperAsync(int shipperId)
        {
            var orders = await _orderRepository.GetByShipperIdAsync(shipperId);
            var shipper = await _shipperRepository.GetByIdAsync(shipperId);
            var users = await _userRepository.GetAllAsync();
            var userDict = users.ToDictionary(u => u.Id, u => u.FullName);

            return orders.Select(o => new PhysicalOrderSummaryDto
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
                ShipperName = shipper?.Name
            }).ToList();
        }

        public async Task<bool> AssignOrderToShipperAsync(AssignShipperDto dto)
        {
            var order = await _orderRepository.GetByIdAsync(dto.OrderId);
            var shipper = await _shipperRepository.GetByIdAsync(dto.ShipperId);

            if (order == null || shipper == null) return false;

            var allOrders = await _orderRepository.GetAllAsync();
            int activeCount = allOrders.Count(o => o.ShipperId == dto.ShipperId && o.Status.ToString() == "Delivering");

            if (activeCount >= shipper.MaxConcurrentOrders)
            {
                throw new InvalidOperationException($"Shipper {shipper.Name} đã đạt giới hạn nhận {shipper.MaxConcurrentOrders} đơn hàng cùng lúc.");
            }

            order.ShipperId = dto.ShipperId;
            _orderRepository.Update(order);
            await _orderRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnassignOrderAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return false;

            order.ShipperId = null;
            _orderRepository.Update(order);
            await _orderRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CreateShipperAsync(ShipperDto dto)
        {
            var shipper = new Shipper
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Area = dto.Area,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
                MaxConcurrentOrders = dto.MaxConcurrentOrders > 0 ? dto.MaxConcurrentOrders : 5
            };

            await _shipperRepository.AddAsync(shipper);
            await _shipperRepository.SaveChangesAsync();
            return true;
        }
    }
}
