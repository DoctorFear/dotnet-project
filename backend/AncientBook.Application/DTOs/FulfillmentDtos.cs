using System;
using System.Collections.Generic;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
    // Request đóng gói đơn hàng (UC18)
    public class PackOrderRequest
    {
        public int OrderId { get; set; }
        public string? Note { get; set; }
    }

    // Query lấy danh sách đơn chờ đóng gói (UC18)
    public class FulfillmentPendingQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Keyword { get; set; }  // Tìm theo mã đơn / tên khách
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    // Response cho danh sách đơn chờ đóng gói
    public class FulfillmentPendingItem
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public int TotalItems { get; set; }
        public decimal FinalAmount { get; set; }
        public OrderStatus Status { get; set; }
    }

    // Response cho chi tiết đơn đóng gói
    public class FulfillmentDetailResponse
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string? ReceiverPhone { get; set; }
        public List<FulfillmentItemDetail> Items { get; set; } = new List<FulfillmentItemDetail>();
    }

    public class FulfillmentItemDetail
    {
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string? BookCover { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}