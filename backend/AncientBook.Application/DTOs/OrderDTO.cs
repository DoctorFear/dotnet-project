using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
    public class UpdateOrderStatusRequest
    {
        public OrderStatus NewStatus { get; set; }
    }

    public class GetOrdersQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? UserId { get; set; }
        public OrderStatus? Status { get; set; }
        public string? SearchKeyword { get; set; }
        // Điều kiện tìm kiếm và lọc lịch sử đơn hàng.
        public string? BookTitle { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? OrderType { get; set; }
        public string? StatusGroup { get; set; }
        public string? SortBy { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class OrderResponseDto
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public bool IsPaid { get; set; }
        public string? PayUrl { get; set; }
        public string? PackingIssue { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? ReturnDeadline { get; set; }
        public string? FailureReason { get; set; }
        public string? PaymentMethod { get; set; }
        public OrderReturnDto? ReturnInfo { get; set; }
        public List<OrderHistoryReviewDto> Reviews { get; set; } = new();
        public int RewardPoints { get; set; }
        public int? PresentationScenario { get; set; }

        public OrderUserDto? User { get; set; }
        public List<OrderItemResponseDto> OrderItems { get; set; } = new();
    }

    public class OrderUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }

    public class OrderItemResponseDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public PurchaseType? PurchaseType { get; set; }
        public RentalDurationType? RentalDuration { get; set; }
        public DateTime? RentalStartDate { get; set; }
        public DateTime? RentalEndDate { get; set; }

        public OrderBookDto? Book { get; set; }
    }

    public class OrderReturnDto
    {
        public string Reason { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new();
        public string? VideoUrl { get; set; }
        public string? Outcome { get; set; }
        public string? OutcomeReason { get; set; }
    }

    public class OrderHistoryReviewDto
    {
        public int BookId { get; set; }
        public int Rating { get; set; }
        public string? Content { get; set; }
        public bool IsHidden { get; set; }
    }

    public class OrderBookDto
    {
        public int Id { get; set; }
        public string Isbn { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string? CoverImg { get; set; }
    }
}
