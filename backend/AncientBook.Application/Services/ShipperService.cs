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
    public interface IShipperService
    {
        Task<List<ShipperDto>> GetAllShippersAsync(string? status = null, string? area = null);
        Task<ShipperDto?> GetShipperByIdAsync(int id);
        Task<List<PhysicalOrderSummaryDto>> GetOrdersByShipperAsync(int shipperId);
        Task<bool> AssignOrderToShipperAsync(AssignShipperDto dto);
        Task<bool> UnassignOrderAsync(int orderId);
        Task<bool> CreateShipperAsync(ShipperDto dto);
        Task<bool> UpdateShipperAsync(int id, ShipperDto dto);
        Task<bool> UpdateShipperStatusAsync(int id, string status);
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

        public async Task<List<ShipperDto>> GetAllShippersAsync(string? status = null, string? area = null)
        {
            await EnsureShipperUsersSyncedAsync();

            var shippers = await _shipperRepository.GetByFilterAsync(status, area);
            var allOrders = await _orderRepository.GetAllAsync();

            return shippers.Select(s => new ShipperDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                Area = s.Area,
                Status = s.Status,
                MaxConcurrentOrders = s.MaxConcurrentOrders,
                ActiveOrdersCount = CountActiveOrdersForShipper(allOrders, s.Id)
            }).ToList();
        }

        /// <summary>
        /// Tự động đồng bộ các tài khoản User có Role == UserRole.Shipper từ DatabaseSeeder sang bảng Shippers
        /// </summary>
        private async Task EnsureShipperUsersSyncedAsync()
        {
            var users = await _userRepository.GetAllAsync();
            var shipperUsers = users.Where(u => u.Role == UserRole.Shipper).ToList();
            if (!shipperUsers.Any()) return;

            var existingShippers = await _shipperRepository.GetAllAsync();
            bool added = false;

            foreach (var su in shipperUsers)
            {
                bool exists = existingShippers.Any(s =>
                    (!string.IsNullOrWhiteSpace(su.PhoneNumber) && s.Phone == su.PhoneNumber) ||
                    string.Equals(s.Name, su.FullName, StringComparison.OrdinalIgnoreCase));

                if (!exists)
                {
                    await _shipperRepository.AddAsync(new Shipper
                    {
                        UserId = su.Id,
                        Name = su.FullName,
                        Phone = su.PhoneNumber ?? string.Empty,
                        Area = "TP. Hồ Chí Minh",
                        Status = su.IsActive ? "Active" : "Off",
                        MaxConcurrentOrders = 5
                    });
                    added = true;
                }
            }

            if (added)
            {
                await _shipperRepository.SaveChangesAsync();
            }
        }

        public async Task<ShipperDto?> GetShipperByIdAsync(int id)
        {
            var shipper = await _shipperRepository.GetByIdAsync(id);
            if (shipper == null) return null;

            var orders = await _orderRepository.GetByShipperIdAsync(id);
            return new ShipperDto
            {
                Id = shipper.Id,
                Name = shipper.Name,
                Phone = shipper.Phone,
                Area = shipper.Area,
                Status = shipper.Status,
                MaxConcurrentOrders = shipper.MaxConcurrentOrders,
                ActiveOrdersCount = orders.Count(IsOrderActiveWithShipper)
            };
        }

        public async Task<List<PhysicalOrderSummaryDto>> GetOrdersByShipperAsync(int shipperId)
        {
            var orders = await _orderRepository.GetByShipperIdAsync(shipperId);
            var shipper = await _shipperRepository.GetByIdAsync(shipperId);
            var users = await _userRepository.GetAllAsync();
            var userDict = users.ToDictionary(u => u.Id, u => u.FullName);

            return orders
                .OrderByDescending(o => o.OrderDate)
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
                    ShipperName = shipper?.Name
                }).ToList();
        }

        public async Task<bool> AssignOrderToShipperAsync(AssignShipperDto dto)
        {
            var order = await _orderRepository.GetByIdAsync(dto.OrderId);
            var shipper = await _shipperRepository.GetByIdAsync(dto.ShipperId);

            if (order == null || shipper == null) return false;

            if (!string.Equals(shipper.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Shipper {shipper.Name} hiện đang ở trạng thái '{shipper.Status}', không thể nhận đơn mới.");
            }

            if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Failed || order.Status == OrderStatus.Returned)
            {
                throw new InvalidOperationException($"Không thể phân công đơn hàng đang ở trạng thái '{order.Status}'.");
            }

            var shipperOrders = await _orderRepository.GetByShipperIdAsync(dto.ShipperId);
            int activeCount = shipperOrders.Count(o => o.Id != dto.OrderId && IsOrderActiveWithShipper(o));

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

            if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Returned)
            {
                throw new InvalidOperationException("Không thể hủy phân công đối với đơn hàng đã hoàn tất.");
            }

            order.ShipperId = null;
            _orderRepository.Update(order);
            await _orderRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CreateShipperAsync(ShipperDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Phone))
            {
                return false;
            }

            var shipper = new Shipper
            {
                Name = dto.Name.Trim(),
                Phone = dto.Phone.Trim(),
                Area = dto.Area?.Trim() ?? string.Empty,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                MaxConcurrentOrders = dto.MaxConcurrentOrders > 0 ? dto.MaxConcurrentOrders : 5
            };

            await _shipperRepository.AddAsync(shipper);
            await _shipperRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateShipperAsync(int id, ShipperDto dto)
        {
            var shipper = await _shipperRepository.GetByIdAsync(id);
            if (shipper == null) return false;

            if (!string.IsNullOrWhiteSpace(dto.Name))
                shipper.Name = dto.Name.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Phone))
                shipper.Phone = dto.Phone.Trim();

            if (dto.Area != null)
                shipper.Area = dto.Area.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Status))
                shipper.Status = dto.Status.Trim();

            if (dto.MaxConcurrentOrders > 0)
                shipper.MaxConcurrentOrders = dto.MaxConcurrentOrders;

            _shipperRepository.Update(shipper);
            await _shipperRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateShipperStatusAsync(int id, string status)
        {
            var shipper = await _shipperRepository.GetByIdAsync(id);
            if (shipper == null || string.IsNullOrWhiteSpace(status)) return false;

            shipper.Status = status.Trim();
            _shipperRepository.Update(shipper);
            await _shipperRepository.SaveChangesAsync();
            return true;
        }

        private static int CountActiveOrdersForShipper(IEnumerable<Order> orders, int shipperId)
        {
            return orders.Count(o => o.ShipperId == shipperId && IsOrderActiveWithShipper(o));
        }

        private static bool IsOrderActiveWithShipper(Order order)
        {
            return order.Status != OrderStatus.Completed
                && order.Status != OrderStatus.Failed
                && order.Status != OrderStatus.Returned;
        }
    }
}
