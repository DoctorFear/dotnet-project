using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class StockAlert : BaseEntity
    {
        public int BookId { get; set; }
        public int CurrentStock { get; set; }
        public int MinThreshold { get; set; }
        public string Status { get; set; } = "LowStock"; // LowStock, OutOfStock[cite: 3]
        public bool IsResolved { get; set; } = false; 
    }
}