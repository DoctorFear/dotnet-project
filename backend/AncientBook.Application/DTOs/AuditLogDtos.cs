using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    public class AuditLogFilterDto
    {
        public string? Keyword { get; set; }
        public string? Module { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 15;
    }

    public class AuditLogItemDto
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public int? UserId { get; set; }
        public string PerformerEmail { get; set; } = "System";
        public string PerformerFullName { get; set; } = "Hệ thống";
        public string PerformerRole { get; set; } = "System";
        public string Action { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string? RecordId { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
    }
}