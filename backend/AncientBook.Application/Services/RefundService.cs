using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Application.Common;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AncientBook.Application.Services
{
    public class RefundService : IRefundService
    {
        private readonly IRefundRepository _refundRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<RefundService> _logger;

        public RefundService(
            IRefundRepository refundRepository,
            IOrderRepository orderRepository,
            IFileStorageService fileStorageService,
            ILogger<RefundService> logger)
        {
            _refundRepository = refundRepository;
            _orderRepository = orderRepository;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<bool> SubmitRefundRequestAsync(RefundRequestDto request, int userId)
        {
            var order = await _orderRepository.GetByIdAsync(request.OrderId);
            if (order == null) throw new KeyNotFoundException($"Không tìm thấy đơn hàng #{request.OrderId}.");
            if (order.UserId != userId) throw new UnauthorizedAccessException("Bạn không có quyền thao tác trên đơn hàng này.");
            if (order.Status != OrderStatus.Completed) throw new InvalidOperationException("Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã hoàn thành.");

            var existingRefund = await _refundRepository.GetByOrderIdAsync(request.OrderId);
            if (existingRefund != null) throw new InvalidOperationException("Đơn hàng này đã gửi yêu cầu hoàn tiền trước đó.");

            var refund = new Refund
            {
                OrderId = request.OrderId,
                Reason = request.Reason,
                ShippingMethod = request.ShippingMethod,
                Description = request.Description,
                BankAccount = request.BankAccount
            };

            string folderName = $"Refunds/Order_{request.OrderId}";
            if (request.Images != null && request.Images.Count > 0)
            {
                foreach (var img in request.Images)
                {
                    var url = await _fileStorageService.SaveRefundMediaAsync(img, folderName);
                    if (!string.IsNullOrEmpty(url)) refund.ImageUrls.Add(url);
                }
            }

            if (request.Video != null)
            {
                refund.VideoUrl = await _fileStorageService.SaveRefundMediaAsync(request.Video, folderName);
            }

            await _refundRepository.AddAsync(refund);

            order.Status = OrderStatus.ReturnRequested;
            order.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            await _orderRepository.UpdateAsync(order);

            _logger.LogInformation("Người dùng {UserId} vừa tạo biểu mẫu hoàn tiền cho đơn #{OrderId}", userId, request.OrderId);
            return true;
        }

        public async Task<RefundResponseDto?> GetRefundByOrderIdAsync(int orderId, int userId, string userRole)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new KeyNotFoundException($"Không tìm thấy đơn hàng #{orderId}.");

            bool isAdminOrStaff = userRole == "Admin" || userRole == "Staff";
            if (!isAdminOrStaff && order.UserId != userId)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin hoàn trả của đơn hàng này.");
            }

            var refund = await _refundRepository.GetByOrderIdAsync(orderId);
            if (refund == null) return null;

            return new RefundResponseDto
            {
                Id = refund.Id,
                OrderId = refund.OrderId,
                Reason = refund.Reason,
                ShippingMethod = refund.ShippingMethod,
                Description = refund.Description,
                BankAccount = refund.BankAccount,
                ImageUrls = refund.ImageUrls,
                VideoUrl = refund.VideoUrl,
                CreatedAt = refund.CreatedAt
            };
        }

        public async Task<PagedResult<RefundResponseDto>> GetPagedRefundsAsync(GetRefundsQuery query)
        {
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1) query.PageSize = 10;
            if (query.PageSize > 100) query.PageSize = 100;

            var (items, totalCount) = await _refundRepository.GetPagedRefundsAsync(query);

            return new PagedResult<RefundResponseDto>
            (
                items,
                query.PageNumber,
                query.PageSize,
                totalCount
            );
        }
    }
}