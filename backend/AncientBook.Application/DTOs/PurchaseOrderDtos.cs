using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    public class PurchaseOrderItemDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int OrderedQuantity { get; set; }
        public int ReceivedQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal => (ReceivedQuantity > 0 ? ReceivedQuantity : OrderedQuantity) * UnitPrice;
    }

    public class PurchaseOrderDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Draft, Pending, Approved, Cancelled
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string? CancelReason { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public List<PurchaseOrderItemDto> Items { get; set; } = new();
    }

    public class CreatePurchaseOrderItemDto
    {
        public int BookId { get; set; }
        public int OrderedQuantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class CreatePurchaseOrderDto
    {
        public int SupplierId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public bool IsDraft { get; set; } = false;
        public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
    }

    public class UpdatePurchaseOrderDto
    {
        public int SupplierId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Draft or Pending
        public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
    }

    public class ApprovePurchaseOrderItemDto
    {
        public int BookId { get; set; }
        public int ReceivedQuantity { get; set; }
    }

    public class ApprovePurchaseOrderDto
    {
        public string? Notes { get; set; }
        public List<ApprovePurchaseOrderItemDto> ReceivedItems { get; set; } = new();
    }

    public class CancelPurchaseOrderDto
    {
        public string CancelReason { get; set; } = string.Empty;
    }
}
