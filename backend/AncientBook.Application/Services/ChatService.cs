using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.DTOs.Chat;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AncientBook.Application.Services;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepository;

    public ChatService(IChatRepository chatRepository)
    {
        _chatRepository = chatRepository;
    }

    // ==========================================
    // PHÂN HỆ KHÁCH HÀNG (UC23)
    // ==========================================

    public async Task<CustomerChatSessionDto> GetOrCreateCustomerSessionAsync(int customerId)
    {
        var session = await _chatRepository.GetActiveOrPendingSessionByCustomerIdAsync(customerId);

        if (session == null)
        {
            session = new ChatSession
            {
                CustomerId = customerId,
                Status = ChatSessionStatus.Pending,
                StartedAt = DateTime.UtcNow
            };

            await _chatRepository.AddSessionAsync(session);

            var createEvent = new ChatSessionEvent
            {
                ChatSession = session,
                ActorId = customerId,
                EventType = ChatEventType.Created,
                CreatedAt = DateTime.UtcNow,
                Note = "Khách hàng mở phiên hỗ trợ mới."
            };
            await _chatRepository.AddEventAsync(createEvent);

            var welcomeMessage = new ChatMessage
            {
                ChatSession = session,
                SenderId = customerId,
                SenderRole = UserRole.Staff,
                Content = "Chào bạn! Cảm ơn bạn đã liên hệ AncientBook. Bạn đang quan tâm đến ấn bản sách nào hoặc cần hỗ trợ về đơn hàng?",
                IsReadByCustomer = true,
                IsReadByStaff = true
            };
            await _chatRepository.AddMessageAsync(welcomeMessage);

            await _chatRepository.SaveChangesAsync();
        }

        var messages = await _chatRepository.GetMessagesBySessionIdAsync(session.Id);
        var events = await _chatRepository.GetEventsBySessionIdAsync(session.Id);

        var timeline = BuildCustomerTimeline(messages, events);
        int unreadCount = messages.Count(m => m.SenderRole == UserRole.Staff && !m.IsReadByCustomer);

        return new CustomerChatSessionDto
        {
            Id = session.Id,
            Status = session.Status,
            StaffDisplayName = "Tư vấn viên",
            HasAssignedStaff = session.StaffId.HasValue,
            UnreadMessagesCount = unreadCount,
            StartedAt = session.StartedAt,
            ClosedAt = session.ClosedAt,
            Timeline = timeline
        };
    }

    public async Task<ChatMessageDto> SendCustomerMessageAsync(int customerId, int sessionId, SendMessageRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Content) && string.IsNullOrEmpty(request.AttachmentUrl))
        {
            throw new ArgumentException("Nội dung tin nhắn hoặc tệp đính kèm không được để trống.");
        }

        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null || session.CustomerId != customerId)
        {
            throw new KeyNotFoundException("Phiên hỗ trợ không tồn tại hoặc bạn không có quyền truy cập.");
        }

        if (session.Status == ChatSessionStatus.Closed)
        {
            throw new InvalidOperationException("Phiên hỗ trợ này đã kết thúc.");
        }

        var message = new ChatMessage
        {
            ChatSessionId = sessionId,
            SenderId = customerId,
            SenderRole = UserRole.Member,
            Content = request.Content?.Trim(),
            AttachmentUrl = request.AttachmentUrl,
            IsReadByCustomer = true,
            IsReadByStaff = false
        };

        await _chatRepository.AddMessageAsync(message);
        await _chatRepository.SaveChangesAsync();

        return new ChatMessageDto
        {
            Id = message.Id,
            ChatSessionId = message.ChatSessionId,
            SenderId = message.SenderId,
            SenderName = "Bạn",
            SenderRole = message.SenderRole,
            Content = message.Content,
            AttachmentUrl = message.AttachmentUrl,
            IsRead = true,
            CreatedAt = message.CreatedAt
        };
    }

    public async Task MarkAsReadByCustomerAsync(int customerId, int sessionId)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session != null && session.CustomerId == customerId)
        {
            await _chatRepository.MarkMessagesAsReadAsync(sessionId, isCustomer: true);
            await _chatRepository.SaveChangesAsync();
        }
    }

    // ==========================================
    // PHÂN HỆ NHÂN VIÊN HỖ TRỢ - STAFF (UC24)
    // ==========================================

    public async Task<(List<StaffChatSessionDto> Items, int TotalCount)> GetQueueSessionsAsync(ChatQueueFilterDto filter)
    {
        var (sessions, totalCount) = await _chatRepository.GetQueueSessionsAsync(
            filter.Status,
            filter.StaffId,
            filter.PageNumber,
            filter.PageSize);

        var dtoList = sessions.Select(s =>
        {
            var lastMsg = s.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            return new StaffChatSessionDto
            {
                Id = s.Id,
                Status = s.Status,
                CustomerId = s.CustomerId,
                CustomerName = s.Customer?.FullName ?? "Khách hàng",
                CustomerEmail = s.Customer?.Email,
                CustomerPhone = s.Customer?.PhoneNumber,
                StaffId = s.StaffId,
                StaffName = s.Staff?.FullName,
                InternalNote = s.InternalNote,
                LastMessagePreview = lastMsg != null
                    ? (!string.IsNullOrEmpty(lastMsg.Content) ? lastMsg.Content : "[Hình ảnh đính kèm]")
                    : null,
                LastActivityAt = lastMsg?.CreatedAt ?? s.StartedAt,
                UnreadCount = s.Messages.Count(m => m.SenderRole == UserRole.Member && !m.IsReadByStaff),
                StartedAt = s.StartedAt,
                ClosedAt = s.ClosedAt,
                RowVersion = s.RowVersion
            };
        }).ToList();

        return (dtoList, totalCount);
    }

    public async Task<(StaffChatSessionDto Session, List<ChatTimelineItemDto> Timeline)> GetStaffSessionDetailAsync(int sessionId)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên chat.");

        var messages = await _chatRepository.GetMessagesBySessionIdAsync(sessionId);
        var events = await _chatRepository.GetEventsBySessionIdAsync(sessionId);

        var timeline = BuildStaffTimeline(messages, events);

        var sessionDto = new StaffChatSessionDto
        {
            Id = session.Id,
            Status = session.Status,
            CustomerId = session.CustomerId,
            CustomerName = session.Customer?.FullName ?? "Khách hàng",
            CustomerEmail = session.Customer?.Email,
            CustomerPhone = session.Customer?.PhoneNumber,
            StaffId = session.StaffId,
            StaffName = session.Staff?.FullName,
            InternalNote = session.InternalNote,
            StartedAt = session.StartedAt,
            ClosedAt = session.ClosedAt,
            RowVersion = session.RowVersion
        };

        return (sessionDto, timeline);
    }

    public async Task<ChatSessionEventDto> AcceptSessionAsync(int staffId, int sessionId)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên hỗ trợ.");

        // E1 UC24: Kiểm tra tranh chấp tiếp nhận
        if (session.Status != ChatSessionStatus.Pending || session.StaffId != null)
        {
            throw new InvalidOperationException($"Phiên chat này đã được tiếp nhận bởi {session.Staff?.FullName ?? "nhân viên khác"}.");
        }

        session.StaffId = staffId;
        session.Status = ChatSessionStatus.Active;

        var acceptEvent = new ChatSessionEvent
        {
            ChatSessionId = sessionId,
            ActorId = staffId,
            NextStaffId = staffId,
            EventType = ChatEventType.Accepted,
            CreatedAt = DateTime.UtcNow,
            Note = "Nhân viên tiếp nhận phiên hỗ trợ."
        };

        await _chatRepository.AddEventAsync(acceptEvent);

        try
        {
            await _chatRepository.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException("Phiên chat vừa được tiếp nhận bởi nhân viên khác.");
        }

        return new ChatSessionEventDto
        {
            Id = acceptEvent.Id,
            ChatSessionId = sessionId,
            EventType = acceptEvent.EventType,
            EventDescription = $"Tư vấn viên (Mã NV: {staffId}) đã tiếp nhận phiên hỗ trợ.",
            ActorId = staffId,
            CreatedAt = acceptEvent.CreatedAt
        };
    }

    public async Task<ChatMessageDto> SendStaffMessageAsync(int staffId, int sessionId, SendMessageRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Content) && string.IsNullOrEmpty(request.AttachmentUrl))
        {
            throw new ArgumentException("Nội dung tin nhắn không được để trống.");
        }

        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên chat.");

        if (session.Status == ChatSessionStatus.Closed)
        {
            throw new InvalidOperationException("Phiên hỗ trợ này đã kết thúc, không thể gửi thêm tin nhắn.");
        }

        // BR02 & E3 UC24: Chỉ nhân viên phụ trách mới có quyền gửi tin nhắn
        if (session.StaffId != staffId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền gửi tin nhắn vào phiên do nhân viên khác phụ trách.");
        }

        var message = new ChatMessage
        {
            ChatSessionId = sessionId,
            SenderId = staffId,
            SenderRole = UserRole.Staff,
            Content = request.Content?.Trim(),
            AttachmentUrl = request.AttachmentUrl,
            IsReadByCustomer = false,
            IsReadByStaff = true
        };

        await _chatRepository.AddMessageAsync(message);
        await _chatRepository.SaveChangesAsync();

        return new ChatMessageDto
        {
            Id = message.Id,
            ChatSessionId = message.ChatSessionId,
            SenderId = message.SenderId,
            SenderName = session.Staff?.FullName ?? "Tư vấn viên",
            SenderRole = message.SenderRole,
            Content = message.Content,
            AttachmentUrl = message.AttachmentUrl,
            IsRead = false,
            CreatedAt = message.CreatedAt
        };
    }

    public async Task<ChatSessionEventDto> TransferSessionAsync(int currentStaffId, int sessionId, TransferSessionRequestDto request)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên chat.");

        if (session.StaffId != currentStaffId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chuyển giao phiên chat này.");
        }

        int? previousStaffId = session.StaffId;
        session.StaffId = request.TargetStaffId;

        var transferEvent = new ChatSessionEvent
        {
            ChatSessionId = sessionId,
            ActorId = currentStaffId,
            PreviousStaffId = previousStaffId,
            NextStaffId = request.TargetStaffId,
            EventType = ChatEventType.Transferred,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        await _chatRepository.AddEventAsync(transferEvent);
        await _chatRepository.SaveChangesAsync();

        return new ChatSessionEventDto
        {
            Id = transferEvent.Id,
            ChatSessionId = sessionId,
            EventType = transferEvent.EventType,
            EventDescription = "Phiên hỗ trợ đã được chuyển giao cho nhân viên mới.",
            ActorId = currentStaffId,
            Note = request.Note,
            CreatedAt = transferEvent.CreatedAt
        };
    }

    public async Task<ChatSessionEventDto> LeaveSessionAsync(int staffId, int sessionId)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên chat.");

        if (session.StaffId != staffId)
        {
            throw new UnauthorizedAccessException("Bạn không phải người phụ trách phiên này để thực hiện rời phiên.");
        }

        int? oldStaffId = session.StaffId;
        session.StaffId = null;
        session.Status = ChatSessionStatus.Pending;

        var leaveEvent = new ChatSessionEvent
        {
            ChatSessionId = sessionId,
            ActorId = staffId,
            PreviousStaffId = oldStaffId,
            EventType = ChatEventType.Left,
            CreatedAt = DateTime.UtcNow,
            Note = "Nhân viên rời phiên, đưa về hàng đợi chung."
        };

        await _chatRepository.AddEventAsync(leaveEvent);
        await _chatRepository.SaveChangesAsync();

        return new ChatSessionEventDto
        {
            Id = leaveEvent.Id,
            ChatSessionId = sessionId,
            EventType = leaveEvent.EventType,
            EventDescription = "Tư vấn viên đã rời phiên. Phiên được đưa về hàng đợi.",
            ActorId = staffId,
            CreatedAt = leaveEvent.CreatedAt
        };
    }

    public async Task<ChatSessionEventDto> CloseSessionAsync(int staffId, int sessionId)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên chat.");

        if (session.StaffId != staffId)
        {
            throw new UnauthorizedAccessException("Chỉ nhân viên phụ trách phiên mới có quyền kết thúc phiên.");
        }

        session.Status = ChatSessionStatus.Closed;
        session.ClosedAt = DateTime.UtcNow;

        var closeEvent = new ChatSessionEvent
        {
            ChatSessionId = sessionId,
            ActorId = staffId,
            EventType = ChatEventType.Closed,
            CreatedAt = DateTime.UtcNow,
            Note = "Phiên hỗ trợ đã được kết thúc."
        };

        await _chatRepository.AddEventAsync(closeEvent);
        await _chatRepository.SaveChangesAsync();

        return new ChatSessionEventDto
        {
            Id = closeEvent.Id,
            ChatSessionId = sessionId,
            EventType = closeEvent.EventType,
            EventDescription = "Phiên hỗ trợ đã kết thúc.",
            ActorId = staffId,
            CreatedAt = closeEvent.CreatedAt
        };
    }

    public async Task UpdateInternalNoteAsync(int sessionId, UpdateSessionNoteRequestDto request)
    {
        var session = await _chatRepository.GetSessionByIdAsync(sessionId);
        if (session == null) throw new KeyNotFoundException("Không tìm thấy phiên chat.");

        session.InternalNote = request.InternalNote;
        await _chatRepository.SaveChangesAsync();
    }

    public async Task MarkAsReadByStaffAsync(int staffId, int sessionId)
    {
        await _chatRepository.MarkMessagesAsReadAsync(sessionId, isCustomer: false);
        await _chatRepository.SaveChangesAsync();
    }

    // ==========================================
    // CÁC HÀM MAP DỮ LIỆU NỘI BỘ
    // ==========================================

    private static List<ChatTimelineItemDto> BuildCustomerTimeline(List<ChatMessage> messages, List<ChatSessionEvent> events)
    {
        var timeline = new List<ChatTimelineItemDto>();

        foreach (var msg in messages)
        {
            timeline.Add(new ChatTimelineItemDto
            {
                ItemType = "Message",
                Timestamp = msg.CreatedAt,
                Message = new ChatMessageDto
                {
                    Id = msg.Id,
                    ChatSessionId = msg.ChatSessionId,
                    SenderId = msg.SenderId,
                    SenderName = msg.SenderRole == UserRole.Member ? "Bạn" : "Tư vấn viên", // Luôn ẩn danh
                    SenderRole = msg.SenderRole,
                    Content = msg.Content,
                    AttachmentUrl = msg.AttachmentUrl,
                    IsRead = msg.IsReadByCustomer,
                    CreatedAt = msg.CreatedAt
                }
            });
        }

        foreach (var ev in events)
        {
            if (ev.EventType == ChatEventType.Closed)
            {
                timeline.Add(new ChatTimelineItemDto
                {
                    ItemType = "Event",
                    Timestamp = ev.CreatedAt,
                    Event = new ChatSessionEventDto
                    {
                        Id = ev.Id,
                        ChatSessionId = ev.ChatSessionId,
                        EventType = ev.EventType,
                        EventDescription = "Phiên hỗ trợ đã kết thúc.",
                        CreatedAt = ev.CreatedAt
                    }
                });
            }
        }

        return timeline.OrderBy(t => t.Timestamp).ToList();
    }

    private static List<ChatTimelineItemDto> BuildStaffTimeline(List<ChatMessage> messages, List<ChatSessionEvent> events)
    {
        var timeline = new List<ChatTimelineItemDto>();

        foreach (var msg in messages)
        {
            timeline.Add(new ChatTimelineItemDto
            {
                ItemType = "Message",
                Timestamp = msg.CreatedAt,
                Message = new ChatMessageDto
                {
                    Id = msg.Id,
                    ChatSessionId = msg.ChatSessionId,
                    SenderId = msg.SenderId,
                    SenderName = msg.Sender?.FullName ?? (msg.SenderRole == UserRole.Member ? "Khách hàng" : "Tư vấn viên"),
                    SenderRole = msg.SenderRole,
                    Content = msg.Content,
                    AttachmentUrl = msg.AttachmentUrl,
                    IsRead = msg.IsReadByStaff,
                    CreatedAt = msg.CreatedAt
                }
            });
        }

        foreach (var ev in events)
        {
            string desc = ev.EventType switch
            {
                ChatEventType.Created => "Khách hàng khởi tạo phiên chat.",
                ChatEventType.Accepted => $"Tư vấn viên {ev.Actor?.FullName ?? $"ID {ev.ActorId}"} đã tiếp nhận phiên.",
                ChatEventType.Transferred => $"Đã chuyển phiên từ {ev.PreviousStaff?.FullName ?? "NV"} sang {ev.NextStaff?.FullName ?? "NV"}.",
                ChatEventType.Left => $"Nhân viên {ev.Actor?.FullName} đã rời phiên về hàng đợi.",
                ChatEventType.Closed => "Phiên hỗ trợ đã kết thúc.",
                _ => "Sự kiện hệ thống"
            };

            timeline.Add(new ChatTimelineItemDto
            {
                ItemType = "Event",
                Timestamp = ev.CreatedAt,
                Event = new ChatSessionEventDto
                {
                    Id = ev.Id,
                    ChatSessionId = ev.ChatSessionId,
                    EventType = ev.EventType,
                    EventDescription = desc,
                    ActorId = ev.ActorId,
                    ActorName = ev.Actor?.FullName ?? string.Empty,
                    Note = ev.Note,
                    CreatedAt = ev.CreatedAt
                }
            });
        }

        return timeline.OrderBy(t => t.Timestamp).ToList();
    }
}