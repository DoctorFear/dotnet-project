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
    public class FPointService : IFPointService
    {
        private readonly IFPointRepository _fpointRepository;
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly ILogger<FPointService> _logger;

        public FPointService(
            IFPointRepository fpointRepository,
            IUserRepository userRepository,
            IOrderRepository orderRepository,
            ILogger<FPointService> logger)
        {
            _fpointRepository = fpointRepository;
            _userRepository = userRepository;
            _orderRepository = orderRepository;
            _logger = logger;
        }

        // UC22: Xem số dư điểm
        public async Task<FPointBalanceDto> GetBalanceAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy user với ID: {userId}");
            }

            var tierName = "Đồng";
            var pointRate = 5;

            // TODO: Lấy MembershipTier từ user
            // Tạm thời dùng mặc định

            return new FPointBalanceDto
            {
                UserId = user.Id,
                CurrentPoints = user.FPoints,
                TotalPointsEarned = user.FPoints,
                TierName = tierName,
                PointRate = pointRate,
                TotalSpent = user.TotalSpent
            };
        }

        // UC22: Xem lịch sử biến động điểm
        public async Task<PagedResult<FPointTransactionDto>> GetHistoryAsync(int userId, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            // TODO: Implement repository call
            var items = new List<FPointTransactionDto>();
            return new PagedResult<FPointTransactionDto>(items, 0, pageNumber, pageSize);
        }

        // UC22: Sử dụng điểm khi checkout
        public async Task<UseFPointResponse> ValidateAndCalculatePointsAsync(int userId, UseFPointRequest request)
        {
            // UC22 BR03: 1 F-Point = 100 VNĐ
            // Số điểm tối đa = min(số dư, 50% tiền sách, 1000 F-Point)
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy user với ID: {userId}");
            }

            var maxByBalance = user.FPoints;
            var maxByAmount = (int)(request.TotalAmount * 0.5m / 100);  // 50% tiền sách
            var maxAllowed = Math.Min(maxByBalance, Math.Min(maxByAmount, 1000));

            var pointsToUse = request.PointsToUse;
            if (pointsToUse > maxAllowed)
            {
                pointsToUse = maxAllowed;
            }

            var discountAmount = pointsToUse * 100m;  // 1 F-Point = 100 VNĐ
            var finalAmount = request.TotalAmount - discountAmount;

            return new UseFPointResponse
            {
                PointsUsed = pointsToUse,
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount,
                Message = pointsToUse > 0 
                    ? $"Sử dụng {pointsToUse} F-Point, giảm {discountAmount:N0} VNĐ." 
                    : "Không sử dụng điểm."
            };
        }

        // UC22: Lấy danh sách hạng thành viên
        public async Task<List<MembershipTierDto>> GetMembershipTiersAsync()
        {
            // TODO: Implement repository call
            return await Task.FromResult(new List<MembershipTierDto>
            {
                new MembershipTierDto { Id = 1, TierName = "Đồng", MinSpending = 0, PointRate = 5 },
                new MembershipTierDto { Id = 2, TierName = "Bạc", MinSpending = 5000000, PointRate = 10 },
                new MembershipTierDto { Id = 3, TierName = "Vàng", MinSpending = 20000000, PointRate = 15 }
            });
        }

        // UC22: Tự động nâng hạng
        public async Task<bool> AutoUpgradeTierAsync(int userId, int orderId, decimal totalSpent)
        {
            // TODO: Implement logic
            _logger.LogInformation("Auto upgrade tier cho user #{UserId} với tổng chi tiêu {TotalSpent}", userId, totalSpent);
            return await Task.FromResult(true);
        }
    }
}