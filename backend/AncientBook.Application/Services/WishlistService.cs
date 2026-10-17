using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;

namespace AncientBook.Application.Services;

public class WishlistService(IWishlistRepository repository, IBookService books) : IWishlistService
{
    public async Task<List<BookDetailDto>> GetAsync(int userId)
    {
        var result = new List<BookDetailDto>();
        foreach (var id in await repository.GetBookIdsAsync(userId))
        {
            var book = await books.GetBookDetailByIdAsync(id);
            if (book != null) result.Add(book);
        }
        return result;
    }

    public async Task AddAsync(int userId, int bookId)
    {
        if (!await repository.BookExistsAsync(bookId))
            throw new KeyNotFoundException("Không tìm thấy sách.");
        await repository.AddAsync(userId, bookId);
    }

    public Task RemoveAsync(int userId, int bookId) => repository.RemoveAsync(userId, bookId);
}
