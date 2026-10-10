using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    // ===== UC19: Shipper xem danh sách đơn được phân công =====
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

    // ===== UC19: Chi tiết đơn hàng cho shipper =====
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
        public List<DeliveryItemDto> Items { get; set; } = new();
    }

    public class DeliveryItemDto
    {
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    // ===== UC19: Cập nhật trạng thái giao hàng =====
    public class UpdateDeliveryStatusRequest
    {
        public string NewStatus { get; set; } = string.Empty;   // "Shipping", "Completed", "Failed"
        public int? FailureReasonId { get; set; }
        public string? FailureNote { get; set; }
    }

    // ===== UC19: Lý do giao thất bại =====
    public class FailureReasonDto
    {
        public int Id { get; set; }
        public string ReasonText { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    // ===== UC19: Query lọc đơn hàng =====
    public class DeliveryOrderQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; }
        public string? Keyword { get; set; }
    }
}