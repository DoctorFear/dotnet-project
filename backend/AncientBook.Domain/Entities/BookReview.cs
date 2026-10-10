using System;
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    // Đánh giá sách (UC21)
    public class BookReview : BaseEntity
    {
        public int BookId { get; set; }
        public int UserId { get; set; }

        // Gắn với đơn hàng "đã mua"
        public int? OrderId { get; set; }

        // Nội dung đánh giá
        public int Rating { get; set; }         
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ImageUrls { get; set; }  

        // Xác thực & kiểm duyệt
        public bool IsVerifiedPurchase { get; set; } = false;
        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

        // Tương tác
        public int HelpfulCount { get; set; } = 0;
        public int ReportCount { get; set; } = 0;

        // Đã cộng F-Point chưa (tránh cộng 2 lần)
        public bool IsPointsAwarded { get; set; } = false;

        // Navigation properties
        public Book? Book { get; set; }
        public User? User { get; set; }
        public Order? Order { get; set; }
    }
}