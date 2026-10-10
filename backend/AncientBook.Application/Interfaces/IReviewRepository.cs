using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IReviewRepository
    {
        Task<BookReview?> GetByIdAsync(int id);
        Task<BookReview?> GetByUserBookOrderAsync(int userId, int bookId, int? orderId);
        Task AddAsync(BookReview review);
        Task UpdateAsync(BookReview review);
        Task DeleteAsync(int id);
        Task<(List<BookReview> Items, int TotalCount)> GetByBookAsync(int bookId, int pageNumber, int pageSize, int? ratingFilter, bool? verifiedOnly);
        Task<(List<BookReview> Items, int TotalCount)> GetByUserAsync(int userId, int pageNumber, int pageSize);
        Task<(double AverageRating, int TotalCount)> CalculateBookRatingAsync(int bookId);
        Task<Dictionary<int, int>> GetRatingBreakdownAsync(int bookId);
    }
}