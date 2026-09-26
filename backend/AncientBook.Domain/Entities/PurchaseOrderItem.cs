using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class PurchaseOrderItem : BaseEntity
    {
        public int PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;

        public int BookId { get; set; }
        public int OrderedQuantity { get; set; }
        public int ReceivedQuantity { get; set; } // Số lượng thực nhận khi kiểm kho
        public decimal UnitPrice { get; set; }
    }
}