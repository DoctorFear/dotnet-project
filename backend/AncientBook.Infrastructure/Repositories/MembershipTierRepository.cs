using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;

namespace AncientBook.Infrastructure.Repositories
{
    public class MembershipTierRepository : IMembershipTierRepository
    {
        private readonly ApplicationDbContext _context;

        public MembershipTierRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<MembershipTier>> GetAllActiveAsync()
        {
            return await _context.MembershipTiers
                .Where(t => t.IsActive)
                .OrderBy(t => t.DisplayOrder)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<MembershipTier?> GetByIdAsync(int id)
        {
            return await _context.MembershipTiers
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<MembershipTier?> GetTierBySpendingAsync(decimal totalSpent)
        {
            return await _context.MembershipTiers
                .Where(t => t.IsActive && t.MinSpending <= totalSpent)
                .OrderByDescending(t => t.MinSpending)
                .FirstOrDefaultAsync();
        }

        public async Task UpdateAsync(MembershipTier tier)
        {
            _context.MembershipTiers.Update(tier);
            await _context.SaveChangesAsync();
        }
    }
}