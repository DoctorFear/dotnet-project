using AncientBook.Application.DTOs;

namespace AncientBook.Application.Services
{
    public interface ICartService
    {
        Task AddItemToCartAsync(AddToCartRequest request);
        Task<CartResponseDto> GetCartAsync(int userId);
        Task RemoveCartItemAsync(int userId, int cartItemId);
        Task UpdateCartItemAsync(int userId, int cartItemId, UpdateCartItemRequest request);
    }
}