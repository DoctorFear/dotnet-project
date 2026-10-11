using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IMembershipTierRepository
    {
        Task<List<MembershipTier>> GetAllActiveAsync();
        Task<MembershipTier?> GetByIdAsync(int id);
        Task<MembershipTier?> GetTierBySpendingAsync(decimal totalSpent);
        Task UpdateAsync(MembershipTier tier);
    }
}