using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class StockMovement : BaseEntity, IAuditableEntity
    {
        public Guid BookId { get; set; }
        public string MovementType { get; set; } = string.Empty; // Import (Nhập), Sale (Bán), Audit_Adjustment (Cân bằng kiểm kê)
        public int QuantityChange { get; set; } // (+ số lượng) hoặc (- số lượng)[cite: 3]
        public int StockBefore { get; set; }
        public int StockAfter { get; set; }
        public string Reason { get; set; } = string.Empty; // Hư hỏng, thất thoát, nhầm lẫn...[cite: 3]
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}