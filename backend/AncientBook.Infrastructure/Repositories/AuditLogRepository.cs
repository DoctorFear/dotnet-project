using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly ApplicationDbContext _context;

        public AuditLogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(List<AuditLog> Items, int TotalCount)> GetPagedAuditLogsAsync(AuditLogFilterDto filter)
        {
            var query = _context.AuditLogs
                .AsNoTracking()
                .Include(a => a.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Module))
            {
                var mod = filter.Module.Trim().ToUpper();
                query = query.Where(a => a.Module.ToUpper() == mod);
            }

            if (!string.IsNullOrWhiteSpace(filter.Keyword))
            {
                var kw = filter.Keyword.Trim().ToLower();
                query = query.Where(a => a.Action.ToLower().Contains(kw) ||
                                         a.EntityName.ToLower().Contains(kw) ||
                                         (a.RecordId != null && a.RecordId.ToLower().Contains(kw)) ||
                                         (a.Details != null && a.Details.ToLower().Contains(kw)) ||
                                         (a.User != null && a.User.Email.ToLower().Contains(kw)));
            }

            if (filter.FromDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= filter.FromDate.Value);
            }

            if (filter.ToDate.HasValue)
            {
                var endOfDay = filter.ToDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(a => a.Timestamp <= endOfDay);
            }

            int totalCount = await query.CountAsync();

            if (totalCount == 0)
            {
                return (new List<AuditLog>(), 0);
            }

            var items = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task AddAsync(AuditLog log)
        {
            await _context.AuditLogs.AddAsync(log);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}