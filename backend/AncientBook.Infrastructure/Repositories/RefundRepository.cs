using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace AncientBook.Infrastructure.Repositories
{
    public class RefundRepository : IRefundRepository
    {
        private readonly ApplicationDbContext _context;

        public RefundRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Refund?> GetByOrderIdAsync(int orderId)
        {
            return await _context.Set<Refund>()
                .FirstOrDefaultAsync(r => r.OrderId == orderId);
        }

        public async Task AddAsync(Refund refund)
        {
            await _context.Refunds.AddAsync(refund);
        }

        public async Task<(List<RefundResponseDto> Items, int TotalCount)> GetPagedRefundsAsync(GetRefundsQuery query)
        {
            var dbQuery = _context.Set<Refund>()
                .Include(r => r.Order)
                .ThenInclude(o => o.User)
                .AsNoTracking()
                .AsQueryable();

            if (query.UserId.HasValue)
            {
                dbQuery = dbQuery.Where(r => r.Order != null && r.Order.UserId == query.UserId.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            {
                var keyword = query.SearchKeyword.Trim().ToLower();
                dbQuery = dbQuery.Where(r => 
                    (r.Order != null && r.Order.User != null && 
                        (r.Order.User.Username.ToLower().Contains(keyword) || 
                         r.Order.User.Email.ToLower().Contains(keyword) || 
                         r.Order.User.FullName.ToLower().Contains(keyword))) ||
                    r.OrderId.ToString() == keyword ||
                    r.Id.ToString() == keyword
                );
            }

            int totalCount = await dbQuery.CountAsync();

            var items = await dbQuery
                .OrderByDescending(r => r.CreatedAt)
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(r => new RefundResponseDto
                {
                    Id = r.Id,
                    OrderId = r.OrderId,
                    Reason = r.Reason,
                    ShippingMethod = r.ShippingMethod,
                    Description = r.Description,
                    BankAccount = r.BankAccount,
                    ImageUrls = r.ImageUrls,
                    VideoUrl = r.VideoUrl,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return (items, totalCount);
        }
    }
}