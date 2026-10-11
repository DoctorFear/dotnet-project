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
        public int OrderId { get; set; }
        public string? Note { get; set; }
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
        public string CustomerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public int TotalItems { get; set; }
        public decimal FinalAmount { get; set; }
        public OrderStatus Status { get; set; }
    }

    public class FulfillmentDetailResponse
    {
        public string? PackingIssue { get; set; }
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
