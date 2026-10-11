using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities;

// Thông báo được lưu trong cùng transaction với thao tác nghiệp vụ.
public class FulfillmentNotification : BaseEntity
{
    public int? UserId { get; set; }
    public string Audience { get; set; } = "Staff";
    public string Message { get; set; } = string.Empty;
    public int? OrderId { get; set; }
}
