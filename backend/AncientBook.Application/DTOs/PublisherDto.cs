namespace AncientBook.Application.DTOs
{
    // DTO hiển thị nhà xuất bản
    public class PublisherDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Description { get; set; }
        public int BookCount { get; set; }
    }

    // DTO tiếp nhận dữ liệu thêm/sửa nhà xuất bản 
    public class SavePublisherDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Description { get; set; }
    }
}