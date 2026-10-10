using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Danh mục lý do giao thất bại (UC19)
    public class FailureReason : BaseEntity
    {
        public string ReasonText { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        // Navigation: 1 lý do có thể áp dụng cho nhiều đơn
        public ICollection<OrderFailureReason> OrderFailureReasons { get; set; } = new List<OrderFailureReason>();
    }
}