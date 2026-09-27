using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Quản lý Danh mục thể loại sách 
    public class Category : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // ID danh mục cha (dành cho cây danh mục đệ quy)
        public int? ParentId { get; set; }

        public ICollection<BookCategory> BookCategories { get; set; } = new List<BookCategory>();
    }
}
