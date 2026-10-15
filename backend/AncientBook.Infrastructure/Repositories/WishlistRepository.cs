using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories;

public class WishlistRepository(ApplicationDbContext context) : IWishlistRepository
{
    public Task<List<int>> GetBookIdsAsync(int userId) => context.Set<WishlistItem>()
        .AsNoTracking().Where(x => x.UserId == userId)
        .OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.BookId)
        .Select(x => x.BookId).ToListAsync();

    public Task<bool> BookExistsAsync(int bookId) => context.Books.AnyAsync(x => x.Id == bookId);

    public async Task AddAsync(int userId, int bookId)
    {
        // Khóa theo tài khoản để hai request đồng thời không tạo bản ghi trùng.
        await using var transaction = await context.BeginWorkflowTransactionAsync();
        await context.LockUserAsync(userId);
        if (!await context.Set<WishlistItem>().AnyAsync(x => x.UserId == userId && x.BookId == bookId))
        {
            context.Set<WishlistItem>().Add(new WishlistItem { UserId = userId, BookId = bookId });
            await context.SaveChangesAsync();
        }
        await transaction.CommitAsync();
    }

    public async Task RemoveAsync(int userId, int bookId)
    {
        await context.Set<WishlistItem>().Where(x => x.UserId == userId && x.BookId == bookId).ExecuteDeleteAsync();
    }
}
