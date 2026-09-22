using System.Collections.Generic;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
    public class CheckoutItemDto
    {
        public int BookId { get; set; }
        public int Quantity { get; set; }
    }

    public class CreateCheckoutRequest
    {
        public int UserId { get; set; }
        public int? PromotionId { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public List<CheckoutItemDto> Items { get; set; } = new();
    }

    public class CreateCheckoutResponse
    {
        public int OrderId { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public System.DateTime OrderDate { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class GetMomoResponse
    {
        public int OrderId { get; set; }
        public string RequestId { get; set; } = string.Empty;
        public bool IsPaid { get; set; }
        public string PaymentUrl { get; set; } = string.Empty;
        public string Deeplink { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;
        public string DeeplinkWebInApp { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class CreateMomoResponse
    {
        public int OrderId { get; set; }
        public string PayUrl { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}