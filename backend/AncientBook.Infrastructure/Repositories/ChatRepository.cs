using AncientBook.Application.Common.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AncientBook.Infrastructure.Persistence.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly ApplicationDbContext _context;

    public ChatRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ==========================================
    // NHÓM PHIÊN CHAT (SESSIONS)
    // ==========================================

    public async Task<ChatSession?> GetSessionByIdAsync(int sessionId)
    {
        return await _context.ChatSessions
            .Include(s => s.Customer)
            .Include(s => s.Staff)
            .FirstOrDefaultAsync(s => s.Id == sessionId);
    }

    public async Task<ChatSession?> GetActiveOrPendingSessionByCustomerIdAsync(int customerId)
    {
        return await _context.ChatSessions
            .Include(s => s.Staff)
            .Where(s => s.CustomerId == customerId &&
                       (s.Status == ChatSessionStatus.Pending || s.Status == ChatSessionStatus.Active))
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<(List<ChatSession> Items, int TotalCount)> GetQueueSessionsAsync(
        ChatSessionStatus status,
        int? staffId,
        int pageNumber,
        int pageSize)
    {
        var query = _context.ChatSessions
            .Include(s => s.Customer)
            .Include(s => s.Staff)
            .Include(s => s.Messages)
            .Where(s => s.Status == status);

        // Nếu ở tab Đang xử lý (Active) và có lọc theo nhân viên cụ thể
        if (status == ChatSessionStatus.Active && staffId.HasValue)
        {
            query = query.Where(s => s.StaffId == staffId.Value);
        }

        int totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.StartedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task AddSessionAsync(ChatSession session)
    {
        await _context.ChatSessions.AddAsync(session);
    }

    // ==========================================
    // NHÓM TIN NHẮN (MESSAGES)
    // ==========================================

    public async Task AddMessageAsync(ChatMessage message)
    {
        await _context.ChatMessages.AddAsync(message);
    }

    public async Task<List<ChatMessage>> GetMessagesBySessionIdAsync(int sessionId, int skip = 0, int take = 50)
    {
        return await _context.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.ChatSessionId == sessionId)
            .OrderBy(m => m.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task MarkMessagesAsReadAsync(int sessionId, bool isCustomer)
    {
        if (isCustomer)
        {
            // Khách hàng đọc các tin nhắn gửi từ Staff
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.ChatSessionId == sessionId &&
                            m.SenderRole == UserRole.Staff &&
                            !m.IsReadByCustomer)
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.IsReadByCustomer = true;
            }
        }
        else
        {
            // Nhân viên đọc các tin nhắn gửi từ Khách hàng
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.ChatSessionId == sessionId &&
                            m.SenderRole == UserRole.Member &&
                            !m.IsReadByStaff)
                .ToListAsync();

            foreach (var msg in unreadMessages)
            {
                msg.IsReadByStaff = true;
            }
        }
    }

    // ==========================================
    // NHÓM SỰ KIỆN (EVENTS)
    // ==========================================

    public async Task AddEventAsync(ChatSessionEvent sessionEvent)
    {
        await _context.ChatSessionEvents.AddAsync(sessionEvent);
    }

    public async Task<List<ChatSessionEvent>> GetEventsBySessionIdAsync(int sessionId)
    {
        return await _context.ChatSessionEvents
            .Include(e => e.Actor)
            .Include(e => e.PreviousStaff)
            .Include(e => e.NextStaff)
            .Where(e => e.ChatSessionId == sessionId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();
    }

    // ==========================================
    // LƯU THAY ĐỔI (COMMIT UNIT OF WORK)
    // ==========================================

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}