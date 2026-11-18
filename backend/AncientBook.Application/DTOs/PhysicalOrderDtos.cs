using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    public class PhysicalOrderSummaryDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal FinalAmount { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsPaid { get; set; }
        public int? ShipperId { get; set; }
        public string? ShipperName { get; set; }
    }

    public class PhysicalOrderItemDto
    {
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string CoverImg { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal SubTotal => Quantity * UnitPrice;
    }

    public class OrderTimelineStepDto
    {
        public string StepCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public bool IsCurrent { get; set; }
        public DateTime? Timestamp { get; set; }
    }

    public class OrderTrackingDetailDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public bool IsPaid { get; set; }
        public int? ShipperId { get; set; }
        public string? ShipperName { get; set; }
        public string? ShipperPhone { get; set; }
        public List<PhysicalOrderItemDto> Items { get; set; } = new();
        public List<OrderTimelineStepDto> Timeline { get; set; } = new();
    }

    public class UpdatePhysicalOrderStatusDto
    {
        public string NewStatus { get; set; } = string.Empty;
    }

    public class PagedPhysicalOrdersResponseDto
    {
        public List<PhysicalOrderSummaryDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
    }
}
