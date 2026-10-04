using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class PurchaseOrderItem : BaseEntity
    {
        public int PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;

        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public int OrderedQuantity { get; set; }  // Đổi từ QuantityOrdered sang OrderedQuantity
        public int ReceivedQuantity { get; set; } // Đổi từ QuantityReceived sang ReceivedQuantity
        public decimal UnitPrice { get; set; }
    }
}
