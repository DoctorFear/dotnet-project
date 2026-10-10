using System;
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    // Lịch sử chuyển trạng thái đơn hàng (UC18, UC19)
    public class OrderStatusHistory : BaseEntity
    {
        public int OrderId { get; set; }

        public OrderStatus FromStatus { get; set; }
        public OrderStatus ToStatus { get; set; }

        public string? Note { get; set; }
        public string? ChangedBy { get; set; }
        public DateTime ChangedAt { get; set; } = TimeZoneHelper.GetVietnamTime();
        public string? IpAddress { get; set; }

        // Navigation property
        public Order? Order { get; set; }
    }
}