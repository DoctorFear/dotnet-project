using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Infrastructure.Repositories
{
    public interface ICartRepository
    {
        Task<Cart?> GetByUserIdAsync(int userId);
        Task<CartItem?> GetCartItemAsync(int cartId, int bookId, PurchaseType purchaseType);
        Task AddAsync(Cart cart);
        Task AddItemAsync(CartItem cartItem);
        Task UpdateItemAsync(CartItem cartItem);
        Task SaveChangesAsync();
        Task RemoveItemAsync(CartItem cartItem);
        Task<CartItem?> GetCartItemByIdAsync(int cartItemId);
    }
}