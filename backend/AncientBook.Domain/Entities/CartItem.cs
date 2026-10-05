using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    public class CartItem : BaseEntity
    {
        public int CartId { get; set; }
        public Cart? Cart { get; set; }

        public int BookId { get; set; }
        public Book? Book { get; set; }

        public int Quantity { get; set; } = 1;
        public PurchaseType PurchaseType { get; set; } = PurchaseType.Physical;
        public RentalDurationType? RentalDuration { get; set; }
    }
}