using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    // ===== UC22: Xem số dư điểm =====
    public class FPointBalanceDto
    {
        public int UserId { get; set; }
        public int CurrentPoints { get; set; }
        public int TotalPointsEarned { get; set; }
        public string TierName { get; set; } = "Đồng";
        public int PointRate { get; set; } = 5;
        public decimal TotalSpent { get; set; }
    }

    // ===== UC22: Lịch sử biến động điểm =====
    public class FPointTransactionDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? OrderId { get; set; }
        public int PointUsed { get; set; }
        public string TransactionType { get; set; } = string.Empty;  // "Earn", "Redeem"
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ===== UC22: Sử dụng điểm khi checkout =====
    public class UseFPointRequest
    {
        public int PointsToUse { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class UseFPointResponse
    {
        public int PointsUsed { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // ===== UC22: Hạng thành viên =====
    public class MembershipTierDto
    {
        public int Id { get; set; }
        public string TierName { get; set; } = string.Empty;
        public decimal MinSpending { get; set; }
        public int PointRate { get; set; }
        public string? Benefits { get; set; }
    }
}