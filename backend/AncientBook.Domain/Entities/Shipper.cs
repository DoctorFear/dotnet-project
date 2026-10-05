using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class Shipper : BaseEntity, IAuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;                  // Khu vực phụ trách giao hàng
        public string Status { get; set; } = "Active";                    // Active, Busy, Off
        public int MaxConcurrentOrders { get; set; } = 5;                 // Số đơn tối đa được gán cùng lúc

        // Navigation Property liên kết với bảng Order (1 - N)
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}