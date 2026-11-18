using System;

namespace AncientBook.Application.DTOs
{
    public class StockAlertDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public int MinThreshold { get; set; }
        public string Status { get; set; } = string.Empty; // LowStock, OutOfStock
        public bool IsResolved { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateThresholdDto
    {
        public int BookId { get; set; }
        public int NewThreshold { get; set; }
    }

    public class InventoryStockDto
    {
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public decimal PhysicalPrice { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReorderLevel { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class StockMovementDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty; // Import, Sale, Audit_Adjustment
        public int QuantityChange { get; set; }
        public int StockBefore { get; set; }
        public int StockAfter { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
    }
}
