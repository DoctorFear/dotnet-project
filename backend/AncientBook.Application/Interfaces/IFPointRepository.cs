using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IFPointRepository
    {
        Task<int> GetCurrentUserPointsAsync(int userId);
        Task IncreasePointsAsync(int userId, int points, int? orderId = null);
        Task DecreasePointsAsync(int userId, int points, int? orderId = null);
        Task<int> CalculateAndAwardPointsAsync(int userId, decimal totalAmount, int? orderId = null);
        Task AddAsync(FPoints record);
        Task<FPoints?> GetAsync(int userId, int orderId);
    }
}