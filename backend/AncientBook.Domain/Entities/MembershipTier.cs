using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Cấu hình hạng thành viên (UC22)
    public class MembershipTier : BaseEntity
    {
        public string TierName { get; set; } = string.Empty;         // "Đồng", "Bạc", "Vàng"
        public decimal MinSpending { get; set; } = 0;                // Mốc chi tiêu tối thiểu
        public int PointRate { get; set; } = 5;                      // Tỉ lệ tích điểm (%)
        public string? Benefits { get; set; }                        // Quyền lợi
        public int DisplayOrder { get; set; } = 0;                   // Thứ tự hiển thị
        public bool IsActive { get; set; } = true;                   // Trạng thái hoạt động

        // Navigation: 1 hạng có nhiều user
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}