using System;
using System.Collections.Generic;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
    public class PackingIssueRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
    public class PackOrderRequest
    {
        public List<PackingVerificationItem> VerifiedItems { get; set; } = new();
        public string? Note { get; set; }
    }

    public class PackingVerificationItem
    {
        public int BookId { get; set; }
        public int VerifiedQuantity { get; set; }
        public List<string> ScannedCodes { get; set; } = new();
        public bool VisualInspectionPassed { get; set; }
    }

    public class FulfillmentPendingQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Keyword { get; set; }  // Tìm theo mã đơn / tên khách
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class FulfillmentPendingItem
    {
        public string? PackingIssue { get; set; }
        public int OrderId { get; set; }
        public string OrderCode => $"ORD-{OrderId:D8}";
        public string CustomerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public int TotalItems { get; set; }
        public decimal FinalAmount { get; set; }
        public string ShippingCarrier { get; set; } = string.Empty;
        public string DeliveryPriority { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public DateTime? PackedAt { get; set; }
        public string? PackedBy { get; set; }
    }

    public class FulfillmentDetailResponse
    {
        public string? PackingIssue { get; set; }
        public int OrderId { get; set; }
        public string OrderCode => $"ORD-{OrderId:D8}";
        public DateTime OrderDate { get; set; }
        public OrderStatus Status { get; set; }
        public bool CanConfirmPacking => Status == OrderStatus.Confirmed;
        public string CustomerName { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string ShippingCarrier { get; set; } = string.Empty;
        public string DeliveryPriority { get; set; } = string.Empty;
        public string? DeliveryNote { get; set; }
        public string WaybillCode { get; set; } = string.Empty;
        public string? ReceiverPhone { get; set; }
        public decimal FinalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public bool IsPaid { get; set; }
        public DateTime? PackedAt { get; set; }
        public string? PackedBy { get; set; }
        public List<FulfillmentItemDetail> Items { get; set; } = new List<FulfillmentItemDetail>();
    }

    public class FulfillmentItemDetail
    {
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public string ShelfLocation { get; set; } = string.Empty;
        public string? BookCover { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
