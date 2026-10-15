using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces;

public interface IWishlistService
{
    Task<List<BookDetailDto>> GetAsync(int userId);
    Task AddAsync(int userId, int bookId);
    Task RemoveAsync(int userId, int bookId);
}
