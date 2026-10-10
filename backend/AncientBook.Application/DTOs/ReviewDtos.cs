using System;
using System.Collections.Generic;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
    // Request tạo đánh giá (UC21)
    public class CreateReviewRequest
    {
        public int BookId { get; set; }
        public int? OrderId { get; set; }
        public int Rating { get; set; }      
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ImageUrls { get; set; }  // JSON array
    }

    // Request sửa đánh giá (trong 30 ngày)
    public class UpdateReviewRequest
    {
        public int ReviewId { get; set; }
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ImageUrls { get; set; }
    }

    // Query danh sách đánh giá của sách
    public class BookReviewQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? RatingFilter { get; set; }  // Lọc theo số sao
        public bool? VerifiedOnly { get; set; }
    }

    // Response đánh giá
    public class ReviewResponse
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? ImageUrls { get; set; }
        public bool IsVerifiedPurchase { get; set; }
        public ReviewStatus Status { get; set; }
        public int HelpfulCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Response tổng hợp đánh giá của sách
    public class BookReviewSummaryResponse
    {
        public int BookId { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> RatingBreakdown { get; set; } = new Dictionary<int, int>();  // {5: 10, 4: 5, ...}
    }
}