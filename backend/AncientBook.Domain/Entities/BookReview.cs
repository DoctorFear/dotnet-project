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

        // Gắn với giao dịch mua hoặc thuê đã được xác thực.
        public int? OrderId { get; set; }

        public int Rating { get; set; }         
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ImageUrls { get; set; }  

        public bool IsVerifiedPurchase { get; set; } = false;
        public PurchaseType? VerifiedPurchaseType { get; set; }
        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

        public int HelpfulCount { get; set; } = 0;
        public int ReportCount { get; set; } = 0;

        // Đã cộng F-Point chưa (tránh cộng 2 lần)
        public bool IsPointsAwarded { get; set; } = false;

        public Book? Book { get; set; }
        public User? User { get; set; }
        public Order? Order { get; set; }
    }
}
