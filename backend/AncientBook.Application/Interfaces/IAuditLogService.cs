using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IAuditLogService
    {
        Task<ApiResponse<PagedResult<AuditLogItemDto>>> GetAuditLogsAsync(AuditLogFilterDto filter);

        Task LogAsync(
            string action,
            string module,
            string entityName,
            string? recordId = null,
            string? oldValues = null,
            string? newValues = null,
            string? details = null,
            int? userId = null,
            string? ipAddress = null);
    }
}