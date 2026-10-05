using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Common.Interfaces;

public interface IChatRepository
{
    // === Nhóm Phiên Chat (Sessions) ===
    Task<ChatSession?> GetSessionByIdAsync(int sessionId);
    Task<ChatSession?> GetActiveOrPendingSessionByCustomerIdAsync(int customerId);
    Task<(List<ChatSession> Items, int TotalCount)> GetQueueSessionsAsync(ChatSessionStatus status, int? staffId, int pageNumber, int pageSize);
    Task AddSessionAsync(ChatSession session);

    // === Nhóm Tin Nhắn (Messages) ===
    Task AddMessageAsync(ChatMessage message);
    Task<List<ChatMessage>> GetMessagesBySessionIdAsync(int sessionId, int skip = 0, int take = 50);
    Task MarkMessagesAsReadAsync(int sessionId, bool isCustomer);

    // === Nhóm Sự Kiện (Events) ===
    Task AddEventAsync(ChatSessionEvent sessionEvent);
    Task<List<ChatSessionEvent>> GetEventsBySessionIdAsync(int sessionId);

    // === Unit of Work / Save ===
    Task<int> SaveChangesAsync();
}