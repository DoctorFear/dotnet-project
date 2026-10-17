using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces;

public interface IWishlistRepository
{
    Task<List<int>> GetBookIdsAsync(int userId);
    Task<bool> BookExistsAsync(int bookId);
    Task AddAsync(int userId, int bookId);
    Task RemoveAsync(int userId, int bookId);
}
