namespace AncientBook.Domain.Common
{
    // Lớp cơ sở dùng chung cho tất cả Entities trong hệ thống
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = TimeZoneHelper.GetVietnamTime();
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}