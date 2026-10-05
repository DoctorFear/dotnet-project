using AncientBook.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AncientBook.Application.DTOs.Chat;
// DTOs Gửi Dữ Liệu Lên (Requests)
public class SendMessageRequestDto
{
    public string? Content { get; set; }
    public string? AttachmentUrl { get; set; }
}

public class TransferSessionRequestDto
{
    [Required(ErrorMessage = "Vui lòng chọn nhân viên tiếp nhận.")]
    public int TargetStaffId { get; set; }

    [MaxLength(500, ErrorMessage = "Ghi chú chuyển giao không vượt quá 500 ký tự.")]
    public string? Note { get; set; }
}

public class UpdateSessionNoteRequestDto
{
    [MaxLength(1000, ErrorMessage = "Ghi chú nội bộ không được vượt quá 1000 ký tự.")]
    public string? InternalNote { get; set; }
}

public class ChatQueueFilterDto
{
    public ChatSessionStatus Status { get; set; } = ChatSessionStatus.Pending;
    public int? StaffId { get; set; } // Lọc theo nhân viên đang phụ trách (dành cho tab Đang xử lý)
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

// DTOs Trả Về Luồng Tin Nhắn & Timeline (Messages & Timeline Responses)
public class ChatMessageDto
{
    public int Id { get; set; }
    public int ChatSessionId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty; // Sẽ được gán "Tư vấn viên" nếu gửi tới khách hàng (BR02 UC23, BR03 UC24)
    public UserRole SenderRole { get; set; }
    public string? Content { get; set; }
    public string? AttachmentUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChatSessionEventDto
{
    public int Id { get; set; }
    public int ChatSessionId { get; set; }
    public ChatEventType EventType { get; set; }
    public string EventDescription { get; set; } = string.Empty; // Ví dụ: "Tư vấn viên Nguyễn Văn A (ID: 2) đã tiếp nhận phiên"
    public int ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChatTimelineItemDto
{
    public string ItemType { get; set; } = "Message"; // "Message" hoặc "Event"
    public DateTime Timestamp { get; set; }
    public ChatMessageDto? Message { get; set; }
    public ChatSessionEventDto? Event { get; set; }
}
//DTOs Phiên Chat (Session Responses)

public class CustomerChatSessionDto
{
    public int Id { get; set; }
    public ChatSessionStatus Status { get; set; }
    public string StaffDisplayName { get; set; } = "Tư vấn viên"; // Luôn ẩn danh theo BR02
    public bool HasAssignedStaff { get; set; } // Cho biết đã có tư vấn viên nhận phiên chưa
    public int UnreadMessagesCount { get; set; } // Phục vụ hiển thị chấm đỏ thông báo chưa đọc
    public DateTime StartedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public List<ChatTimelineItemDto> Timeline { get; set; } = new();
}

public class StaffChatSessionDto
{
    public int Id { get; set; }
    public ChatSessionStatus Status { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public int? StaffId { get; set; }
    public string? StaffName { get; set; }
    public string? InternalNote { get; set; } // Ghi chú nội bộ
    public string? LastMessagePreview { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public int UnreadCount { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>(); // Chống xung đột nhận phiên
}

public class OnlineStaffDto
{
    public int StaffId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int CurrentActiveSessionsCount { get; set; } // Số phiên đang phụ trách để cân nhắc tải công việc
}