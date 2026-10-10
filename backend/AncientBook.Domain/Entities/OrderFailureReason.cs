using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Liên kết đơn hàng với lý do giao thất bại (UC19)
    public class OrderFailureReason : BaseEntity
    {
        public int OrderId { get; set; }
        public int FailureReasonId { get; set; }

        public string? FailureNote { get; set; }
        public int AttemptNumber { get; set; } = 1;
        public string? RecordedBy { get; set; }
        public DateTime RecordedAt { get; set; } = TimeZoneHelper.GetVietnamTime();

        // Navigation properties
        public Order? Order { get; set; }
        public FailureReason? FailureReason { get; set; }
    }
}