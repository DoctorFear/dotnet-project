using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    public class DeliveryOrderSummaryDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string? ReceiverPhone { get; set; }
        public decimal FinalAmount { get; set; }
        public decimal? CodAmount { get; set; }
        public bool IsPaid { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
    }

    public class DeliveryOrderDetailDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? ReceiverPhone { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsPaid { get; set; }
        public decimal FinalAmount { get; set; }
        public decimal? CodAmount { get; set; }
        public string? Note { get; set; }
        public bool IsReadOnly { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? FailureReason { get; set; }
        public string? FailureNote { get; set; }
        public List<DeliveryItemDto> Items { get; set; } = new();
    }

    public class DeliveryItemDto
    {
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class UpdateDeliveryStatusRequest
    {
        public string NewStatus { get; set; } = string.Empty;   // "Shipping", "Completed", "Failed"
        public int? FailureReasonId { get; set; }
        public string? FailureNote { get; set; }
    }

    public class FailureReasonDto
    {
        public int Id { get; set; }
        public string ReasonText { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class DeliveryOrderQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; }
        public string? Keyword { get; set; }
    }
}
