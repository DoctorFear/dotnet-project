using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class PurchaseOrder : BaseEntity, IAuditableEntity
    {
        public string Code { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; } = null!;

        public string Status { get; set; } = "Pending";
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; } = string.Empty; // Bổ sung thuộc tính Notes
        public string? CancelReason { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }

        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    }
}