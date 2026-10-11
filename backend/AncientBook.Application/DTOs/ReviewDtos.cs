using System;
using System.Collections.Generic;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.DTOs
{
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

    public class BookReviewQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? RatingFilter { get; set; }  // Lọc theo số sao
        public bool? VerifiedOnly { get; set; }
    }

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
        public PurchaseType? PurchaseType { get; set; }
        public string? VerificationLabel { get; set; }
        public ReviewStatus Status { get; set; }
        public int HelpfulCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class BookReviewSummaryResponse
    {
        public int BookId { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> RatingBreakdown { get; set; } = new Dictionary<int, int>();  // {5: 10, 4: 5, ...}
    }
}
