using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
    public class UpdateCartItemRequest
    {
        public int Quantity { get; set; } = 1;
        public PurchaseType PurchaseType { get; set; }
        public RentalDurationType? RentalDuration { get; set; }
    }

    public class AddToCartRequest
    {
        public int UserId { get; set; }
        public int BookId { get; set; }
        public int Quantity { get; set; } = 1;
        public PurchaseType PurchaseType { get; set; } = PurchaseType.Physical;
        public RentalDurationType? RentalDuration { get; set; }
    }
    
    public class CartResponseDto
    {
        public int CartId { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal TotalAmount { get; set; }
    }

    public class CartItemResponseDto
    {
        public int CartItemId { get; set; }
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string CoverImg { get; set; } = string.Empty;
        public PurchaseType PurchaseType { get; set; }
        public int Quantity { get; set; }
        public RentalDurationType? RentalDuration { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice => UnitPrice * Quantity;
    }
}