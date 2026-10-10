using System;
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
        private readonly IBookRepository _bookRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IFPointRepository _fpointRepository;  // ← THÊM KHAI BÁO
        private readonly ILogger<ReviewService> _logger;

        public ReviewService(
            IReviewRepository reviewRepository,
            IBookRepository bookRepository,
            IOrderRepository orderRepository,
            IFPointRepository fpointRepository,
            ILogger<ReviewService> logger)
        {
            _reviewRepository = reviewRepository;
            _bookRepository = bookRepository;
            _orderRepository = orderRepository;
            _fpointRepository = fpointRepository;  // ← ĐÃ CÓ
            _logger = logger;
        }

        // ============================================================
        // UC21: Tạo đánh giá
        // ============================================================
        public async Task<ReviewResponse> CreateReviewAsync(int userId, CreateReviewRequest request)
        {
            if (request.Rating < 1 || request.Rating > 5)
            {
                throw new InvalidOperationException("Số sao phải từ 1 đến 5.");
            }

            // BR01: Phải có giao dịch thành công
            bool isVerifiedPurchase = false;
            if (request.OrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(request.OrderId.Value);
                if (order == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy đơn hàng ID: {request.OrderId}");
                }

                if (order.UserId != userId)
                {
                    throw new InvalidOperationException("Đơn hàng không thuộc về bạn.");
                }

                if (order.Status != OrderStatus.Completed)
                {
                    throw new InvalidOperationException($"Đơn hàng chưa hoàn thành (hiện tại: {order.Status}).");
                }

                isVerifiedPurchase = true;
            }

            // BR02: Mỗi đơn + sách chỉ được đánh giá 1 lần
            var existing = await _reviewRepository.GetByUserBookOrderAsync(userId, request.BookId, request.OrderId);
            if (existing != null)
            {
                throw new InvalidOperationException("Bạn đã đánh giá cuốn sách này cho đơn hàng này rồi.");
            }

            var review = new BookReview
            {
                BookId = request.BookId,
                UserId = userId,
                OrderId = request.OrderId,
                Rating = request.Rating,
                Title = request.Title,
                Content = request.Content,
                ImageUrls = request.ImageUrls,
                IsVerifiedPurchase = isVerifiedPurchase,
                Status = ReviewStatus.Approved,
                CreatedAt = TimeZoneHelper.GetVietnamTime(),
                IsPointsAwarded = false
            };

            await _reviewRepository.AddAsync(review);

            // Cập nhật Rating trung bình của Book
            var (avgRating, totalCount) = await _reviewRepository.CalculateBookRatingAsync(request.BookId);
            var book = await _bookRepository.GetForUpdateAsync(request.BookId);
            if (book != null)
            {
                book.Rating = avgRating;
                book.ReviewsCount = totalCount;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                await _bookRepository.SaveChangesAsync();
            }

            // UC21 BR03: Tự động cộng F-Point khi tạo mới đánh giá
            if (!review.IsPointsAwarded)
            {
                const int reviewPoints = 10;  // Cấu hình số điểm thưởng cho mỗi đánh giá
                try
                {
                    await _fpointRepository.IncreasePointsAsync(userId, reviewPoints, null);
                    review.IsPointsAwarded = true;
                    await _reviewRepository.UpdateAsync(review);

                    _logger.LogInformation("Đã cộng {Points} F-Point cho user #{UserId} sau khi đánh giá #{ReviewId}",
                        reviewPoints, userId, review.Id);
                }
                catch (Exception ex)
                {
                    // Không throw để không làm hỏng luồng đánh giá
                    _logger.LogError(ex, "Lỗi khi cộng F-Point cho user #{UserId} sau đánh giá #{ReviewId}",
                        userId, review.Id);
                }
            }

            _logger.LogInformation("User #{UserId} đã đánh giá sách #{BookId} với {Rating} sao",
                userId, request.BookId, request.Rating);

            return MapToResponse(review, book?.Title);
        }

        // ============================================================
        // UC21: Sửa đánh giá (trong 30 ngày)
        // ============================================================
        public async Task<ReviewResponse> UpdateReviewAsync(int userId, UpdateReviewRequest request)
        {
            var review = await _reviewRepository.GetByIdAsync(request.ReviewId);
            if (review == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đánh giá ID: {request.ReviewId}");
            }

            if (review.UserId != userId)
            {
                throw new InvalidOperationException("Bạn không có quyền sửa đánh giá này.");
            }

            // Kiểm tra 30 ngày
            var daysSinceCreated = (TimeZoneHelper.GetVietnamTime() - review.CreatedAt).TotalDays;
            if (daysSinceCreated > 30)
            {
                throw new InvalidOperationException("Chỉ được sửa đánh giá trong vòng 30 ngày.");
            }

            if (request.Rating < 1 || request.Rating > 5)
            {
                throw new InvalidOperationException("Số sao phải từ 1 đến 5.");
            }

            review.Rating = request.Rating;
            review.Title = request.Title;
            review.Content = request.Content;
            review.ImageUrls = request.ImageUrls;
            review.UpdatedAt = TimeZoneHelper.GetVietnamTime();

            await _reviewRepository.UpdateAsync(review);

            // Cập nhật lại Rating của Book
            var (avgRating, totalCount) = await _reviewRepository.CalculateBookRatingAsync(review.BookId);
            var book = await _bookRepository.GetForUpdateAsync(review.BookId);
            if (book != null)
            {
                book.Rating = avgRating;
                book.ReviewsCount = totalCount;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                await _bookRepository.SaveChangesAsync();
            }

            _logger.LogInformation("User #{UserId} đã sửa đánh giá #{ReviewId}", userId, review.Id);

            return MapToResponse(review, book?.Title);
        }

        // ============================================================
        // UC21: Xóa đánh giá
        // ============================================================
        public async Task<bool> DeleteReviewAsync(int userId, int reviewId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);
            if (review == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đánh giá ID: {reviewId}");
            }

            if (review.UserId != userId)
            {
                throw new InvalidOperationException("Bạn không có quyền xóa đánh giá này.");
            }

            var bookId = review.BookId;
            await _reviewRepository.DeleteAsync(reviewId);

            // Cập nhật lại Rating của Book
            var (avgRating, totalCount) = await _reviewRepository.CalculateBookRatingAsync(bookId);
            var book = await _bookRepository.GetForUpdateAsync(bookId);
            if (book != null)
            {
                book.Rating = avgRating;
                book.ReviewsCount = totalCount;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                await _bookRepository.SaveChangesAsync();
            }

            return true;
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
                Status = review.Status,
                HelpfulCount = review.HelpfulCount,
                CreatedAt = review.CreatedAt
            };
        }
    }
}