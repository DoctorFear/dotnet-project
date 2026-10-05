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
    }
}