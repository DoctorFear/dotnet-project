using AncientBook.Application.DTOs.Chat;
using AncientBook.Domain.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces;

public interface IChatService
{
    // ==========================================
    // PHÂN HỆ KHÁCH HÀNG (UC23)
    // ==========================================
    Task<CustomerChatSessionDto> GetOrCreateCustomerSessionAsync(int customerId);
    Task<ChatMessageDto> SendCustomerMessageAsync(int customerId, int sessionId, SendMessageRequestDto request);
    Task MarkAsReadByCustomerAsync(int customerId, int sessionId);

    // ==========================================
    // PHÂN HỆ NHÂN VIÊN HỖ TRỢ - STAFF (UC24)
    // ==========================================
    Task<(List<StaffChatSessionDto> Items, int TotalCount)> GetQueueSessionsAsync(ChatQueueFilterDto filter);
    Task<(StaffChatSessionDto Session, List<ChatTimelineItemDto> Timeline)> GetStaffSessionDetailAsync(int sessionId);

    // Tiếp nhận phiên độc quyền (kiểm tra xung đột E1 UC24)
    Task<ChatSessionEventDto> AcceptSessionAsync(int staffId, int sessionId);

    // Gửi tin nhắn phản hồi (chỉ staff đang phụ trách mới được gửi)
    Task<ChatMessageDto> SendStaffMessageAsync(int staffId, int sessionId, SendMessageRequestDto request);

    // Chuyển giao phiên cho Staff khác trực tuyến
    Task<ChatSessionEventDto> TransferSessionAsync(int currentStaffId, int sessionId, TransferSessionRequestDto request);

    // Rời phiên đưa về hàng đợi chung
    Task<ChatSessionEventDto> LeaveSessionAsync(int staffId, int sessionId);

    // Kết thúc phiên hỗ trợ
    Task<ChatSessionEventDto> CloseSessionAsync(int staffId, int sessionId);

    // Cập nhật ghi chú nội bộ
    Task UpdateInternalNoteAsync(int sessionId, UpdateSessionNoteRequestDto request);

    // Đánh dấu đã đọc
    Task MarkAsReadByStaffAsync(int staffId, int sessionId);
}