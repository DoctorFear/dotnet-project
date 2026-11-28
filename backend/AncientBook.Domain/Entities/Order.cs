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
        public string ShippingCarrier { get; set; } = "AncientBook Delivery";
        public string DeliveryPriority { get; set; } = "Standard";
        public string? DeliveryNote { get; set; }
        public string? WaybillCode { get; set; }
        public string PaymentMethod { get; set; } = "COD";
        public OrderStatus Status { get; set; } = OrderStatus.Pending; 
        public DateTime? ReturnedDeadline { get; set; }
        public string? MoMoRequestId { get; set; }
        public string? PayUrl { get; set; }
        public bool IsPaid { get; set; } = false;
        public int? ShipperId { get; set; } 
        public string? PackingIssue { get; set; }
        public DateTime? ReceiptConfirmedAt { get; set; }
        public decimal? CodCollectedAmount { get; set; }
        public DateTime? CodCollectedAt { get; set; }
        public int? CodCollectedByShipperId { get; set; }
        public string? CodSettlementStatus { get; set; }
        public Shipper? Shipper { get; set; } 
        // Navigation properties
        public User? User { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
