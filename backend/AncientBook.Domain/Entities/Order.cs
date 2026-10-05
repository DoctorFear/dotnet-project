using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    public class Order : BaseEntity
    {
        public int UserId { get; set; }
        public int? PointsId { get; set; }
        public DateTime OrderDate { get; set; } = TimeZoneHelper.GetVietnamTime();
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public decimal FinalAmount { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public OrderStatus Status { get; set; } = OrderStatus.Pending; 
        public string? MoMoRequestId { get; set; }
        public string? PayUrl { get; set; }
        public bool IsPaid { get; set; } = false;
        public int? ShipperId { get; set; } 
        public Shipper? Shipper { get; set; } 
        // Navigation properties
        public User? User { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
