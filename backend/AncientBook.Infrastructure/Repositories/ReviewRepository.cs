using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;

namespace AncientBook.Infrastructure.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;

        public ReviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<BookReview?> GetByIdAsync(int id)
        {
            return await _context.BookReviews
                .Include(r => r.Book)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<BookReview?> GetByUserBookOrderAsync(int userId, int bookId, int? orderId)
        {
            return await _context.BookReviews
                .FirstOrDefaultAsync(r => r.UserId == userId
                                       && r.BookId == bookId
                                       && r.OrderId == orderId);
        }

        public async Task AddAsync(BookReview review)
        {
            await _context.BookReviews.AddAsync(review);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(BookReview review)
        {
            _context.BookReviews.Update(review);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var review = await _context.BookReviews.FindAsync(id);
            if (review != null)
            {
                _context.BookReviews.Remove(review);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(List<BookReview> Items, int TotalCount)> GetByBookAsync(
            int bookId, int pageNumber, int pageSize, int? ratingFilter, bool? verifiedOnly)
        {
            var query = _context.BookReviews
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.BookId == bookId && r.Status == ReviewStatus.Approved);

            if (ratingFilter.HasValue)
            {
                query = query.Where(r => r.Rating == ratingFilter.Value);
            }

            if (verifiedOnly == true)
            {
                query = query.Where(r => r.IsVerifiedPurchase);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(r => r.HelpfulCount)
                .ThenByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<(List<BookReview> Items, int TotalCount)> GetByUserAsync(
            int userId, int pageNumber, int pageSize)
        {
            var query = _context.BookReviews
                .AsNoTracking()
                .Include(r => r.Book)
                .Where(r => r.Status != ReviewStatus.Hidden)
                .Where(r => r.UserId == userId);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<(double AverageRating, int TotalCount)> CalculateBookRatingAsync(int bookId)
        {
            var reviews = _context.BookReviews.AsNoTracking()
                .Where(r => r.BookId == bookId && r.Status == ReviewStatus.Approved);
            return (await reviews.AverageAsync(r => (double?)r.Rating) ?? 0, await reviews.CountAsync());
        }

        public async Task<Dictionary<int, int>> GetRatingBreakdownAsync(int bookId)
        {
            var breakdown = await _context.BookReviews
                .Where(r => r.BookId == bookId && r.Status == ReviewStatus.Approved)
                .GroupBy(r => r.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToListAsync();

            var result = new Dictionary<int, int>();
            for (int i = 1; i <= 5; i++)
            {
                result[i] = breakdown.FirstOrDefault(b => b.Rating == i)?.Count ?? 0;
            }

            return result;
        }
    }
}
