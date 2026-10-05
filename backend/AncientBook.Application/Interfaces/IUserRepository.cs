using AncientBook.Application.DTOs.User;
using AncientBook.Domain.Entities;
    using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByUsernameAsync(string username);
        Task<bool> ExistsByEmailAsync(string email);
        Task<bool> ExistsByUsernameAsync(string username);
        Task AddAsync(User user);
        Task SaveChangesAsync();
        Task<User?> GetByResetTokenAsync(string token);
        Task<User?> GetByRefreshTokenAsync(string refreshToken);
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByIdWithAddressesAsync(int id);
        Task<(List<User> Items, int TotalCount)> GetPagedUsersAsync(UserFilterDto filter);
        Task<int> CountActiveAdminsAsync();
        Task<bool> ExistsByPhoneAsync(string phone);
        Task<List<User>> GetAllAsync();
    }
}