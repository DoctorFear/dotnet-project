namespace AncientBook.Application.DTOs
{
    // DTO hiển thị danh mục thể loại
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentId { get; set; }
        public int BookCount { get; set; }
    }

    // DTO tiếp nhận dữ liệu thêm/sửa thể loại 
    public class SaveCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentId { get; set; }
    }
}