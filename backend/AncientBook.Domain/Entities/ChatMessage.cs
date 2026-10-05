// AncientBook.Domain/Entities/ChatMessage.cs
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities;

public class ChatMessage : BaseEntity
{
    public int ChatSessionId { get; set; }
    public virtual ChatSession ChatSession { get; set; } = null!;

    public int SenderId { get; set; }
    public virtual User Sender { get; set; } = null!;

    public UserRole SenderRole { get; set; }

    public string? Content { get; set; }
    public string? AttachmentUrl { get; set; }

    public bool IsReadByCustomer { get; set; } = false;
    public bool IsReadByStaff { get; set; } = false;
}