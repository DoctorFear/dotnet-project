using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Lịch sử nâng hạng thành viên (UC22)
    public class TierHistory : BaseEntity
    {
        public int UserId { get; set; }
        public string FromTier { get; set; } = string.Empty;
        public string ToTier { get; set; } = string.Empty;
        public decimal TotalSpendingAtChange { get; set; }
        public int? TriggerOrderId { get; set; }
        public DateTime ChangedAt { get; set; } = TimeZoneHelper.GetVietnamTime();
        public string? ChangedBy { get; set; }
        public string? Note { get; set; }

        // Navigation
        public User? User { get; set; }
        public Order? TriggerOrder { get; set; }
    }
}