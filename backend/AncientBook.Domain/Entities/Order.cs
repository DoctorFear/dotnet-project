using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    public class Order : IAuditableEntity
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? PromotionId { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public decimal FinalAmount { get; set; }
        public string ShippingAddress { get; set; } = string.Empty;
        public OrderStatus Status { get; set; } = OrderStatus.Pending; 
        public string? MoMoRequestId { get; set; }
        public string? PayUrl { get; set; }
        public bool IsPaid { get; set; } = false;

        // Navigation properties
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}