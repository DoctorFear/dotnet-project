using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Thực thể Thư viện ảnh phụ Gallery của sách (Quan hệ 1-N với Book)
    public class BookImage : BaseEntity
    {
        // ID sách liên kết
        public int BookId { get; set; }

        // Đường dẫn ảnh phụ / gallery trên Server
        public string ImageUrl { get; set; } = string.Empty;

        // Thứ tự hiển thị hình ảnh
        public int DisplayOrder { get; set; } = 0;

        // Navigation property trỏ về thực thể Book
        public Book? Book { get; set; }
    }
}