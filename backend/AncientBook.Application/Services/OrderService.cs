using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Application.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace AncientBook.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IHmacSha256Hasher _hasher;
        private readonly HttpClient _httpClient;
        private readonly ILogger<OrderService> _logger;

        public OrderService(IOrderRepository orderRepository, IInventoryRepository inventoryRepository, IHmacSha256Hasher hasher, HttpClient httpClient, ILogger<OrderService> logger)
        {
            _orderRepository = orderRepository;
            _inventoryRepository = inventoryRepository;
            _hasher = hasher;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string? updatedBy = null)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.Status == OrderStatus.Failed || order.Status == OrderStatus.Completed)
            {
                throw new InvalidOperationException($"Không thể thay đổi trạng thái của đơn hàng đã ở trạng thái kết thúc ({order.Status}).");
            }

            var previousStatus = order.Status;
            order.Status = newStatus;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            if (!string.IsNullOrEmpty(updatedBy))
            {
                order.UpdatedBy = updatedBy;
            }

            // Hoàn sản phẩm
            if ((newStatus == OrderStatus.Failed && previousStatus != OrderStatus.Failed) || (newStatus == OrderStatus.Returned && previousStatus != OrderStatus.Returned))
            {
                if (order.OrderItems != null)
                {
                    foreach (var item in order.OrderItems)
                    {
                        try
                        {
                            await _inventoryRepository.IncreaseStockAsync(item.BookId, item.Quantity);
                            _logger.LogInformation("Đã hoàn lại {Quantity} sản phẩm cho sách ID {BookId} do hủy đơn hàng #{OrderId}", item.Quantity, item.BookId, order.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "LỖI: Không thể hoàn kho cho sách ID {BookId} khi hủy đơn hàng #{OrderId}", item.BookId, order.Id);
                            throw;
                        }
                    }
                }
            }

            await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("Cập nhật trạng thái đơn hàng #{OrderId} thành công từ {OldStatus} sang {NewStatus}", orderId, previousStatus, newStatus);

            return true;
        }

        public async Task<bool> CancelOrder(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.Status != OrderStatus.Pending || order.Status != OrderStatus.Confirmed || order.Status != OrderStatus.Prepared)
            {
                throw new InvalidOperationException($"Không thể hủy đơn hàng đã ở trạng thái hiện tại ({order.Status}).");
            }

            var previousStatus = order.Status;
            order.Status = OrderStatus.Failed;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();

            // Hoàn sản phẩm
            if (previousStatus == OrderStatus.Pending || previousStatus == OrderStatus.Confirmed || previousStatus == OrderStatus.Prepared)
            {
                if (order.OrderItems != null)
                {
                    foreach (var item in order.OrderItems)
                    {
                        try
                        {
                            if (item.PurchaseType == PurchaseType.Physical)
                            {
                                await _inventoryRepository.IncreaseStockAsync(item.BookId, item.Quantity);
                                _logger.LogInformation("Đã hoàn lại {Quantity} sản phẩm cho sách ID {BookId} do hủy đơn hàng #{OrderId}", item.Quantity, item.BookId, order.Id);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "LỖI: Không thể hoàn kho cho sách ID {BookId} khi hủy đơn hàng #{OrderId}", item.BookId, order.Id);
                            throw;
                        }
                    }
                }
            }

            if (order.IsPaid)
            {
                await ProcessMoMoRefundAsync(order);
            }

            await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("Cập nhật trạng thái đơn hàng #{OrderId} thành công từ {OldStatus} sang {NewStatus}", orderId, previousStatus, order.Status);

            return true;
        }

        public async Task<bool> RequestRefundOrder(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.Status != OrderStatus.Completed)
            {
                throw new InvalidOperationException($"Không thể hoàn đơn hàng đã ở trạng thái hiện tại ({order.Status}).");
            }

            var previousStatus = order.Status;
            order.Status = OrderStatus.ReturnRequested;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();

            await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("Cập nhật trạng thái đơn hàng #{OrderId} thành công từ {OldStatus} sang {NewStatus}", orderId, previousStatus, order.Status);

            return true;
        }

        public async Task<bool> ApproveReturnOrderAsync(int orderId, string adminUser)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }

            if (order.Status != OrderStatus.ReturnRequested)
            {
                throw new InvalidOperationException("Đơn hàng này không nằm trong trạng thái chờ duyệt hoàn trả.");
            }

            var previousStatus = order.Status;
            order.Status = OrderStatus.ReturnApproved;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = adminUser;

            if (order.OrderItems != null)
            {
                foreach (var item in order.OrderItems)
                {
                    await _inventoryRepository.IncreaseStockAsync(item.BookId, item.Quantity);
                    _logger.LogInformation("Admin đã duyệt hoàn trả, hoàn lại {Quantity} sản phẩm cho sách ID {BookId} của đơn #{OrderId}", item.Quantity, item.BookId, order.Id);
                }
            }

            if (order.IsPaid)
            {
                await ProcessMoMoRefundAsync(order);
            }
            order.Status = OrderStatus.Returned;

            await _orderRepository.UpdateAsync(order);
            _logger.LogInformation("Admin {Admin} đã duyệt hoàn trả thành công cho đơn hàng #{OrderId}", adminUser, orderId);

            return true;
        }
        
        public async Task<PagedResult<Order>> GetPagedOrdersAsync(GetOrdersQuery query)
        {
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1) query.PageSize = 10;
            if (query.PageSize > 100) query.PageSize = 100;

            var (items, totalCount) = await _orderRepository.GetPagedOrdersAsync(query.PageNumber, query.PageSize, query.Status?.ToString());

            return new PagedResult<Order>
            (
                items,
                query.PageNumber,
                query.PageSize,
                totalCount
            );
        }

        private async Task ProcessMoMoRefundAsync(Order order)
        {
            try
            {
                var partnerCode = Environment.GetEnvironmentVariable("PARTNERCODE");
                var accessKey = Environment.GetEnvironmentVariable("ACCESSKEY");
                var secretKey = Environment.GetEnvironmentVariable("SECRETKEY") ?? "";
                var refundEndpoint = Environment.GetEnvironmentVariable("REFUNDURL");

                var requestId = Guid.NewGuid().ToString();
                var orderIdStr = order.Id.ToString();
                var amount = ((long)order.FinalAmount).ToString();
                var description = $"Hoàn tiền đơn hàng #{order.Id} tại AncientBook";

                var rawHash = $"accessKey={accessKey}&amount={amount}&description={description}&orderId={orderIdStr}&partnerCode={partnerCode}&requestId={requestId}";
                var signature = _hasher.ComputeHmacSha256(rawHash, secretKey);

                var payload = new
                {
                    partnerCode,
                    accessKey,
                    requestId,
                    orderId = orderIdStr,
                    amount,
                    description,
                    signature
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(refundEndpoint, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseString);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("resultCode", out var resultCode) && resultCode.GetInt32() == 0)
                    {
                        _logger.LogInformation("Hoàn tiền MoMo thành công cho đơn hàng #{OrderId}", order.Id);
                        order.IsPaid = false;
                        return;
                    }
                }

                _logger.LogError("Gọi API hoàn tiền MoMo thất bại cho đơn hàng #{OrderId}", order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi ngoại lệ khi thực hiện gọi API hoàn tiền MoMo cho đơn hàng #{OrderId}", order.Id);
            }
        }
    }
}
