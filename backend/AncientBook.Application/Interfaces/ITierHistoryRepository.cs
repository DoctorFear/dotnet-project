using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface ITierHistoryRepository
    {
        Task AddAsync(TierHistory history);
        Task SaveChangesAsync();
    }
}