using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    public class FPointBalanceDto
    {
        public int UserId { get; set; }
        public int CurrentPoints { get; set; }
        public int PendingPoints { get; set; }
        public int TotalPointsEarned { get; set; }
        public string TierName { get; set; } = "Đồng";
        public int PointRate { get; set; } = 5;
        public decimal TotalSpent { get; set; }
    }

    public class FPointTransactionDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? OrderId { get; set; }
        public int PointUsed { get; set; }
        public int BalanceAfter { get; set; }
        public string TransactionType { get; set; } = string.Empty;  // "Earn", "Redeem"
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = "Available";
        public DateTime? AvailableAt { get; set; }
    }

    public class FPointHistoryQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? TransactionType { get; set; }
    }

    public class FPointHistoryResultDto
    {
        public List<FPointTransactionDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
        public int TotalEarned { get; set; }
        public int TotalRedeemed { get; set; }
        public int TotalRefunded { get; set; }
    }

    public class ConfirmReceiptRequest
    {
        public bool AcceptCloseReturnWindow { get; set; }
    }

    public class OrderPointsDto
    {
        public int OrderId { get; set; }
        public int PendingPoints { get; set; }
        public int AvailablePoints { get; set; }
        public int CancelledPoints { get; set; }
        public DateTime? AvailableAt { get; set; }
        public DateTime? ReceiptConfirmedAt { get; set; }
        public bool CanConfirmReceipt { get; set; }
    }

    // Dữ liệu xem trước mức giảm giá, chưa làm thay đổi số dư điểm.
    public class UseFPointRequest
    {
        public int PointsToUse { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class UseFPointResponse
    {
        public int PointsUsed { get; set; }
        public int MaxPointsAllowed { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class MembershipTierDto
    {
        public int Id { get; set; }
        public string TierName { get; set; } = string.Empty;
        public decimal MinSpending { get; set; }
        public int PointRate { get; set; }
        public string? Benefits { get; set; }
    }
}
