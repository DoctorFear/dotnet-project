using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Thực thể Tồn kho sách (Kế thừa BaseEntity)
    public class Inventory : BaseEntity
    {
        public int BookId { get; set; }
        public int QuantityOnHand { get; set; } = 0;
        public int ReorderLevel { get; set; } = 5;
        public DateTime LastUpdated { get; set; } = TimeZoneHelper.GetVietnamTime();

        // Navigation property
        public Book? Book { get; set; }
    }
}