using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities;

public class ChatSessionEvent : BaseEntity
{
    public int ChatSessionId { get; set; }
    public virtual ChatSession ChatSession { get; set; } = null!;

    public int ActorId { get; set; }
    public virtual User Actor { get; set; } = null!;

    public ChatEventType EventType { get; set; }

    public int? PreviousStaffId { get; set; }
    public virtual User? PreviousStaff { get; set; }

    public int? NextStaffId { get; set; }
    public virtual User? NextStaff { get; set; }

    public string? Note { get; set; }
}