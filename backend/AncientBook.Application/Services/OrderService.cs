using System;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Application.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
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
        private readonly IWorkflowDbContext _workflow;

        public OrderService(IOrderRepository orderRepository, IInventoryRepository inventoryRepository, IHmacSha256Hasher hasher, HttpClient httpClient, ILogger<OrderService> logger, IWorkflowDbContext workflow)
        {
            _orderRepository = orderRepository;
            _inventoryRepository = inventoryRepository;
            _hasher = hasher;
            _httpClient = httpClient;
            _logger = logger;
            _workflow = workflow;
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus newStatus, string? updatedBy = null)
        {
            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();
            await _workflow.LockOrderAsync(orderId);
            var order = await _workflow.Set<Order>().Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");

            if (order.Status != OrderStatus.Pending || newStatus != OrderStatus.Confirmed)
                throw new InvalidOperationException(
                    "Chức năng này chỉ xác nhận đơn Chờ xác nhận. Hãy dùng màn hình Đóng gói/Điều phối/Giao nhận cho các bước tiếp theo.");
            if (!order.OrderItems.Any(item => item.PurchaseType == PurchaseType.Physical))
                throw new InvalidOperationException("Chỉ xác nhận kho qua chức năng này đối với đơn có sách giấy.");

            var previousStatus = order.Status;
            order.Status = OrderStatus.Confirmed;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = string.IsNullOrWhiteSpace(updatedBy) ? "Staff" : updatedBy;
            var actorId = int.TryParse(updatedBy, out var parsedActorId) ? parsedActorId : (int?)null;
            WorkflowSupport.StatusHistory(_workflow, order, previousStatus, order.UpdatedBy,
                "Nhân viên xác nhận đơn; chuyển sang hàng đợi UC35.");
            WorkflowSupport.Audit(_workflow, "OrderConfirmed", "Order", orderId,
                new { Status = previousStatus }, new { order.Status }, actorId);
            WorkflowSupport.Notify(_workflow, $"Đơn #{orderId} đã được xác nhận và chuyển sang khâu đóng gói.",
                orderId, order.UserId);
            await _workflow.SaveChangesAsync();
            await transaction.CommitAsync();
            _logger.LogInformation("Đã xác nhận đơn hàng #{OrderId}; đơn chuyển sang hàng đợi đóng gói.", orderId);
            return true;
        }

        public async Task<bool> CancelOrder(int orderId, int userId)
        {
            await using var transaction = await _workflow.BeginWorkflowTransactionAsync();
            await _workflow.LockOrderAsync(orderId);
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            }
            if (order.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền hủy đơn hàng này.");
            }

            // Chỉ cho hủy đơn trước khi chuẩn bị xong.
            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
            {
                throw new InvalidOperationException($"Không thể hủy đơn hàng đã ở trạng thái hiện tại ({order.Status}).");
            }

            var previousStatus = order.Status;
            order.Status = OrderStatus.Failed;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = userId.ToString();

            // Hoàn sản phẩm
            if (previousStatus == OrderStatus.Pending || previousStatus == OrderStatus.Confirmed)
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
                order.IsPaid = false;
            }
            else
            {
                _logger.LogInformation("Đơn hàng #{OrderId} CHƯA thanh toán, bỏ qua bước hoàn tiền MoMo.", orderId);
            }

            await _orderRepository.UpdateAsync(order);
            await transaction.CommitAsync();
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
            await using var tx = await _workflow.BeginWorkflowTransactionAsync();
            await _workflow.LockOrderAsync(orderId);
            var order = await _workflow.Set<Order>().FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID: {orderId}");
            if (order.Status != OrderStatus.ReturnRequested)
                throw new InvalidOperationException("Đơn hàng này không nằm trong trạng thái chờ duyệt hoàn trả.");

            var previousStatus = order.Status;
            order.Status = OrderStatus.ReturnApproved;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            order.UpdatedBy = adminUser;
            WorkflowSupport.StatusHistory(_workflow, order, previousStatus, adminUser,
                "Yêu cầu hoàn trả đã được duyệt; chờ điều phối Shipper thu hồi.");
            var actorId = int.TryParse(adminUser, out var parsedActorId) ? parsedActorId : (int?)null;
            WorkflowSupport.Audit(_workflow, "ReturnApproved", "Order", orderId,
                new { Status = previousStatus }, new { order.Status }, actorId,
                "Chấp thuận hoàn trả; chưa hoàn kho/hoàn tiền cho đến khi thu hồi thành công.");
            WorkflowSupport.Notify(_workflow,
                $"Yêu cầu hoàn trả đơn #{orderId} đã được duyệt. Shipper sẽ được điều phối đến thu hồi sách.",
                orderId, order.UserId);
            await _workflow.SaveChangesAsync();
            await tx.CommitAsync();
            _logger.LogInformation("Nhân viên {Actor} đã duyệt hoàn trả đơn #{OrderId}; chờ thu hồi.", adminUser, orderId);
            return true;
        }
        
        // Kiểm tra và phân trang danh sách đơn hàng.
        public async Task<PagedResult<OrderResponseDto>> GetPagedOrdersAsync(GetOrdersQuery query)
        {
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1) query.PageSize = 10;
            if (query.PageSize > 100) query.PageSize = 100;

            // Kiểm tra điều kiện lọc đơn hàng.
            query.BookTitle = query.BookTitle?.Trim();
            query.OrderType = query.OrderType?.Trim().ToLower();
            query.StatusGroup = query.StatusGroup?.Trim().ToLower();
            query.SortBy = query.SortBy?.Trim().ToLower();

            if (query.BookTitle?.Length > 200)
            {
                throw new ArgumentException("Tên sách tìm kiếm không được vượt quá 200 ký tự.");
            }
            if (query.FromDate.HasValue && query.ToDate.HasValue && query.FromDate.Value.Date > query.ToDate.Value.Date)
            {
                throw new ArgumentException("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
            }
            if (!string.IsNullOrEmpty(query.OrderType) && !new[] { "all", "physical", "online", "mixed" }.Contains(query.OrderType))
            {
                throw new ArgumentException("Loại đơn hàng không hợp lệ.");
            }
            if (!string.IsNullOrEmpty(query.StatusGroup) && !new[] { "all", "preparing", "shipping", "completed", "returns" }.Contains(query.StatusGroup))
            {
                throw new ArgumentException("Nhóm trạng thái đơn hàng không hợp lệ.");
            }
            if (!string.IsNullOrEmpty(query.SortBy) && !new[] { "newest", "oldest", "price_asc", "price_desc" }.Contains(query.SortBy))
            {
                throw new ArgumentException("Thứ tự sắp xếp đơn hàng không hợp lệ.");
            }

            // var (items, totalCount) = await _orderRepository.GetPagedOrdersAsync(query.PageNumber, query.PageSize, query.Status?.ToString(), query.UserId, query.SearchKeyword);
            var (items, totalCount) = await _orderRepository.GetPagedOrdersAsync(query);

            return new PagedResult<OrderResponseDto>
            (
                items,
                totalCount,
                query.PageNumber,
                query.PageSize
            );
        }

        public async Task<OrderResponseDto?> GetOrderByIdAsync(int orderId)
        {
            return await _orderRepository.GetOrderDtoByIdAsync(orderId);
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
