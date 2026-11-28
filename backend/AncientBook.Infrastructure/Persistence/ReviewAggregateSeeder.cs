using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence;

public static class ReviewAggregateSeeder
{
    public static async Task ReconcileAsync(ApplicationDbContext context)
    {
        var aggregates = await context.BookReviews
            .AsNoTracking()
            .Where(review => review.Status == ReviewStatus.Approved)
            .GroupBy(review => review.BookId)
            .Select(group => new
            {
                BookId = group.Key,
                Count = group.Count(),
                Average = group.Average(review => (double)review.Rating)
            })
            .ToDictionaryAsync(item => item.BookId);

        var changed = false;
        foreach (var book in await context.Books.ToListAsync())
        {
            var count = aggregates.TryGetValue(book.Id, out var aggregate) ? aggregate.Count : 0;
            var average = aggregate == null
                ? 0
                : Math.Round(aggregate.Average, 1, MidpointRounding.AwayFromZero);
            if (book.ReviewsCount == count && Math.Abs(book.Rating - average) < 0.001)
            {
                continue;
            }

            book.ReviewsCount = count;
            book.Rating = average;
            changed = true;
        }

        if (changed)
        {
            await context.SaveChangesAsync();
        }
    }
}
