using System.Data;
using System.Text.Json;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

internal static class WorkflowSupport
{
    public static Task LockOrderAsync(IWorkflowDbContext db, int id) =>
        db.LockOrderAsync(id);
    public static Task LockUserAsync(IWorkflowDbContext db, int id) =>
        db.LockUserAsync(id);
    public static Task LockBookAsync(IWorkflowDbContext db, int id) =>
        db.LockBookAsync(id);

    public static void Audit(IWorkflowDbContext db, string action, string entity, int id,
        object? before, object? after, int? actorId = null, string? details = null)
    {
        db.Set<AuditLog>().Add(new AuditLog
        {
            UserId = actorId, Action = action, Module = "FULFILLMENT", EntityName = entity,
            RecordId = id.ToString(), OldValues = before == null ? null : JsonSerializer.Serialize(before),
            NewValues = after == null ? null : JsonSerializer.Serialize(after),
            Details = details, Timestamp = TimeZoneHelper.GetVietnamTime()
        });
    }

    public static void StatusHistory(IWorkflowDbContext db, Order order, OrderStatus previous,
        string actor, string? note = null) => db.Set<OrderStatusHistory>().Add(new OrderStatusHistory
        {
            OrderId = order.Id, FromStatus = previous, ToStatus = order.Status,
            ChangedBy = actor, ChangedAt = TimeZoneHelper.GetVietnamTime(), Note = note,
            CreatedBy = actor
        });

    public static void Notify(IWorkflowDbContext db, string message, int? orderId = null, int? userId = null) =>
        db.Set<FulfillmentNotification>().Add(new FulfillmentNotification
        {
            UserId = userId, Audience = userId.HasValue ? "Member" : "Staff",
            OrderId = orderId, Message = message, CreatedBy = "System"
        });

    public static async Task<int> IntSettingAsync(IWorkflowDbContext db, string key, int fallback)
    {
        var value = await db.Set<SystemSetting>().AsNoTracking().Where(s => s.SettingKey == key)
            .Select(s => s.SettingValue).FirstOrDefaultAsync();
        if (value == null) return fallback;
        if (!int.TryParse(value, out var result) || result < 0)
            throw new InvalidOperationException($"Cấu hình {key} không hợp lệ.");
        return result;
    }
}
