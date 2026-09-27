using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IAuditLogRepository
    {
        Task<(List<AuditLog> Items, int TotalCount)> GetPagedAuditLogsAsync(AuditLogFilterDto filter);
        Task AddAsync(AuditLog log);
        Task<int> SaveChangesAsync();
    }
}