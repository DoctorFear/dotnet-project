using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities;

public class ChatSession : BaseEntity
{
    public int CustomerId { get; set; }
    public virtual User Customer { get; set; } = null!;

    public int? StaffId { get; set; }
    public virtual User? Staff { get; set; }

    public ChatSessionStatus Status { get; set; } = ChatSessionStatus.Pending;
    public string? InternalNote { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    // Token chống xung đột đồng thời (Concurrency Token - E1 UC24)
    public byte[] RowVersion { get; set; } = null!;

    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ChatSessionEvent> Events { get; set; } = new List<ChatSessionEvent>();
}