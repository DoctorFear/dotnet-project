using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewResponse> CreateReviewAsync(int userId, CreateReviewRequest request);
        Task<ReviewResponse> UpdateReviewAsync(int userId, UpdateReviewRequest request);
        Task<bool> DeleteReviewAsync(int userId, int reviewId);

        Task<PagedResult<ReviewResponse>> GetByBookAsync(int bookId, BookReviewQuery query);
        Task<PagedResult<ReviewResponse>> GetMyReviewsAsync(int userId, int pageNumber, int pageSize);
        Task<BookReviewSummaryResponse> GetBookSummaryAsync(int bookId);
    }
}