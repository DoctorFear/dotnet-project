using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Quản lý Nhà xuất bản 
    public class Publisher : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Description { get; set; }
    }
}