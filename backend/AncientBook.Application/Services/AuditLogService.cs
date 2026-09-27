using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditLogRepository _auditLogRepository;

        public AuditLogService(IAuditLogRepository auditLogRepository)
        {
            _auditLogRepository = auditLogRepository;
        }

        public async Task<ApiResponse<PagedResult<AuditLogItemDto>>> GetAuditLogsAsync(AuditLogFilterDto filter)
        {
            var (logs, totalCount) = await _auditLogRepository.GetPagedAuditLogsAsync(filter);

            if (totalCount == 0)
            {
                var emptyResult = new PagedResult<AuditLogItemDto>(
                    new List<AuditLogItemDto>(),
                    0,
                    filter.PageNumber,
                    filter.PageSize
                );
                return ApiResponse<PagedResult<AuditLogItemDto>>.Ok(emptyResult, "Không có nhật ký nào phù hợp với bộ lọc.");
            }

            var items = logs.Select(a =>
            {
                bool isPasswordRelated = a.Action.Contains("PASSWORD", StringComparison.OrdinalIgnoreCase) ||
                                         (a.Details != null && a.Details.Contains("mật khẩu", StringComparison.OrdinalIgnoreCase));

                return new AuditLogItemDto
                {
                    Id = a.Id,
                    Timestamp = a.Timestamp,
                    UserId = a.UserId,
                    PerformerEmail = a.User != null ? a.User.Email : "System",
                    PerformerFullName = a.User != null ? a.User.FullName : "Hệ thống",
                    PerformerRole = a.User != null ? a.User.Role.ToString() : "System",
                    Action = a.Action,
                    Module = a.Module,
                    EntityName = a.EntityName,
                    RecordId = a.RecordId,
                    OldValues = isPasswordRelated ? "***" : a.OldValues,
                    NewValues = isPasswordRelated ? "***" : a.NewValues,
                    Details = a.Details,
                    IpAddress = a.IpAddress ?? "127.0.0.1"
                };
            }).ToList();

            var result = new PagedResult<AuditLogItemDto>(
                items,
                totalCount,
                filter.PageNumber,
                filter.PageSize
            );

            return ApiResponse<PagedResult<AuditLogItemDto>>.Ok(result);
        }

        public async Task LogAsync(
            string action,
            string module,
            string entityName,
            string? recordId = null,
            string? oldValues = null,
            string? newValues = null,
            string? details = null,
            int? userId = null,
            string? ipAddress = null)
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                Module = module,
                EntityName = entityName,
                RecordId = recordId,
                OldValues = oldValues,
                NewValues = newValues,
                Details = details,
                IpAddress = ipAddress ?? "127.0.0.1",
                Timestamp = DateTime.UtcNow
            };

            await _auditLogRepository.AddAsync(log);
            await _auditLogRepository.SaveChangesAsync();
        }
    }
}