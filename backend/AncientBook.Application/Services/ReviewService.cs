using System;
using System.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IWorkflowDbContext _db;
        public ReviewService(IReviewRepository reviewRepository, IWorkflowDbContext db)
        { _reviewRepository = reviewRepository; _db = db; }

        public async Task<ReviewResponse> CreateReviewAsync(int userId, CreateReviewRequest request)
        {
            ValidateReview(request.Rating, request.Content, request.Title, request.ImageUrls);
            if (!request.OrderId.HasValue) throw new InvalidOperationException("Đánh giá phải gắn với một giao dịch thành công.");
            await using var tx = await _db.BeginWorkflowTransactionAsync();
            await WorkflowSupport.LockOrderAsync(_db, request.OrderId.Value);
            var order = await _db.Set<Order>().Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == request.OrderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
            if (order.UserId != userId) throw new InvalidOperationException("Đơn hàng không thuộc về bạn.");
            var now = TimeZoneHelper.GetVietnamTime();
            var verifiedItem = order.OrderItems.Where(i => i.BookId == request.BookId &&
                (i.PurchaseType == PurchaseType.Physical && order.Status == OrderStatus.Completed && order.IsPaid ||
                 i.PurchaseType == PurchaseType.Rental && order.IsPaid &&
                 order.Status != OrderStatus.Failed && order.Status != OrderStatus.Returned &&
                 i.RentalStartDate.HasValue && i.RentalStartDate <= now))
                .OrderBy(i => i.PurchaseType).ThenBy(i => i.Id).FirstOrDefault();
            if (verifiedItem == null) throw new InvalidOperationException("Sách không thuộc giao dịch mua/thuê đã hoàn tất.");
            // UC21: Mỗi giao dịch chỉ được thưởng đánh giá một lần, kể cả khi đánh giá cũ đã bị ẩn.
            if (await _db.Set<BookReview>().AnyAsync(r => r.UserId == userId && r.OrderId == request.OrderId))
                throw new InvalidOperationException("Giao dịch này đã được đánh giá. Hãy chỉnh sửa đánh giá cũ.");
            await WorkflowSupport.LockBookAsync(_db, request.BookId);
            var book = await _db.Set<Book>().FirstOrDefaultAsync(b => b.Id == request.BookId)
                ?? throw new KeyNotFoundException("Không tìm thấy sách.");
            await WorkflowSupport.LockUserAsync(_db, userId);
            var user = await _db.Set<User>().FirstOrDefaultAsync(u => u.Id == userId && u.IsActive)
                ?? throw new InvalidOperationException("Tài khoản không hoạt động.");
            var reward = await WorkflowSupport.IntSettingAsync(_db, "REVIEW_REWARD_POINTS", 10);
            var source = $"ReviewOrder:{order.Id}:Earn";
            if (await _db.Set<FPoints>().AnyAsync(p => p.SourceKey == source))
                throw new InvalidOperationException("Giao dịch đã nhận điểm đánh giá.");
            var review = new BookReview
            {
                BookId = book.Id, UserId = userId, OrderId = order.Id, Rating = request.Rating,
                Title = request.Title, Content = request.Content!.Trim(), ImageUrls = request.ImageUrls,
                IsVerifiedPurchase = true, VerifiedPurchaseType = verifiedItem.PurchaseType,
                Status = ReviewStatus.Approved, IsPointsAwarded = true
            };
            _db.Set<BookReview>().Add(review);
            var before = user.FPoints;
            user.FPoints = checked(user.FPoints + reward);
            _db.Set<FPoints>().Add(new FPoints { UserId = userId, OrderId = order.Id, PointUsed = -reward,
                SourceKey = source, Description = $"Thưởng đánh giá sách #{book.Id}, đơn #{order.Id}" });
            WorkflowSupport.Audit(_db, "ReviewPointsEarned", "User", userId, new { FPoints = before },
                new { user.FPoints }, details: $"Đánh giá đơn #{order.Id}: +{reward} F-Point.");
            await _db.SaveChangesAsync();
            await RefreshRatingAsync(book);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            review.User = user; review.Book = book;
            return MapToResponse(review, book.Title);
        }

        public async Task<ReviewResponse> UpdateReviewAsync(int userId, UpdateReviewRequest request)
        {
            ValidateReview(request.Rating, request.Content, request.Title, request.ImageUrls);
            await using var tx = await _db.BeginWorkflowTransactionAsync();
            var original = await _db.Set<BookReview>().AsNoTracking().FirstOrDefaultAsync(r => r.Id == request.ReviewId)
                ?? throw new KeyNotFoundException("Không tìm thấy đánh giá.");
            await WorkflowSupport.LockBookAsync(_db, original.BookId);
            var review = await _db.Set<BookReview>().Include(r => r.User).FirstAsync(r => r.Id == request.ReviewId);
            if (review.UserId != userId) throw new InvalidOperationException("Bạn không có quyền sửa đánh giá này.");
            if (review.Status == ReviewStatus.Hidden) throw new InvalidOperationException("Đánh giá đã bị xóa.");
            if (TimeZoneHelper.GetVietnamTime() > review.CreatedAt.AddDays(30))
                throw new InvalidOperationException("Chỉ được sửa đánh giá trong vòng 30 ngày.");
            review.Rating = request.Rating; review.Content = request.Content!.Trim();
            review.Title = request.Title; review.ImageUrls = request.ImageUrls;
            await _db.SaveChangesAsync();
            var book = await _db.Set<Book>().FirstAsync(b => b.Id == review.BookId);
            await RefreshRatingAsync(book);
            await _db.SaveChangesAsync(); await tx.CommitAsync();
            return MapToResponse(review, book.Title);
        }

        public async Task<bool> DeleteReviewAsync(int userId, int reviewId)
        {
            await using var tx = await _db.BeginWorkflowTransactionAsync();
            var original = await _db.Set<BookReview>().AsNoTracking().FirstOrDefaultAsync(r => r.Id == reviewId)
                ?? throw new KeyNotFoundException("Không tìm thấy đánh giá.");
            await WorkflowSupport.LockBookAsync(_db, original.BookId);
            var review = await _db.Set<BookReview>().FirstAsync(r => r.Id == reviewId);
            if (review.UserId != userId) throw new InvalidOperationException("Bạn không có quyền xóa đánh giá này.");
            // Giữ bản ghi đánh giá để ngăn xóa rồi tạo lại nhằm nhận thêm điểm.
            review.Status = ReviewStatus.Hidden;
            await _db.SaveChangesAsync();
            var book = await _db.Set<Book>().FirstAsync(b => b.Id == review.BookId);
            await RefreshRatingAsync(book);
            await _db.SaveChangesAsync(); await tx.CommitAsync();
            return true;
        }

        private async Task RefreshRatingAsync(Book book)
        {
            var ratings = _db.Set<BookReview>().Where(r => r.BookId == book.Id && r.Status == ReviewStatus.Approved);
            book.ReviewsCount = await ratings.CountAsync();
            book.Rating = await ratings.AverageAsync(r => (double?)r.Rating) ?? 0;
        }

        private static void ValidateReview(int rating, string? content, string? title, string? images)
        {
            if (rating < 1 || rating > 5 || string.IsNullOrWhiteSpace(content))
                throw new InvalidOperationException("Vui lòng chọn số sao (1–5) và nhập nội dung bình luận.");
            if (content.Length > 4000 || title?.Length > 200 || images?.Length > 2000)
                throw new InvalidOperationException("Nội dung đánh giá hoặc ảnh vượt độ dài cho phép.");
        }

        public async Task<PagedResult<ReviewResponse>> GetByBookAsync(int bookId, BookReviewQuery query)
        {
            if (query.PageNumber < 1) query.PageNumber = 1;
            if (query.PageSize < 1) query.PageSize = 10;
            if (query.PageSize > 100) query.PageSize = 100;

            var (items, totalCount) = await _reviewRepository.GetByBookAsync(
                bookId, query.PageNumber, query.PageSize, query.RatingFilter, query.VerifiedOnly);

            var result = items.Select(r => MapToResponse(r, null)).ToList();
            return new PagedResult<ReviewResponse>(result, totalCount, query.PageNumber, query.PageSize);
        }

        public async Task<PagedResult<ReviewResponse>> GetMyReviewsAsync(int userId, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var (items, totalCount) = await _reviewRepository.GetByUserAsync(userId, pageNumber, pageSize);

            var result = items.Select(r => MapToResponse(r, r.Book?.Title)).ToList();
            return new PagedResult<ReviewResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<BookReviewSummaryResponse> GetBookSummaryAsync(int bookId)
        {
            var (avgRating, totalCount) = await _reviewRepository.CalculateBookRatingAsync(bookId);
            var breakdown = await _reviewRepository.GetRatingBreakdownAsync(bookId);

            return new BookReviewSummaryResponse
            {
                BookId = bookId,
                AverageRating = avgRating,
                TotalReviews = totalCount,
                RatingBreakdown = breakdown
            };
        }

        private ReviewResponse MapToResponse(BookReview review, string? bookTitle)
        {
            return new ReviewResponse
            {
                Id = review.Id,
                BookId = review.BookId,
                BookTitle = bookTitle ?? review.Book?.Title ?? "N/A",
                UserId = review.UserId,
                UserFullName = review.User?.FullName ?? "N/A",
                Rating = review.Rating,
                Title = review.Title,
                Content = review.Content,
                ImageUrls = review.ImageUrls,
                IsVerifiedPurchase = review.IsVerifiedPurchase,
                PurchaseType = review.IsVerifiedPurchase ? review.VerifiedPurchaseType : null,
                VerificationLabel = !review.IsVerifiedPurchase ? null : review.VerifiedPurchaseType switch
                {
                    PurchaseType.Physical => "Đã mua sách",
                    PurchaseType.Rental => "Đã thuê sách",
                    _ => null
                },
                Status = review.Status,
                HelpfulCount = review.HelpfulCount,
                CreatedAt = review.CreatedAt
            };
        }
    }
}
