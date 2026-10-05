using AncientBook.Application.DTOs.Chat;
using AncientBook.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace AncientBook.API.Hubs;

[Authorize]
public class LiveChatHub : Hub
{
    // Quản lý nhân viên trực tuyến trên RAM: Key là StaffId, Value là danh sách ConnectionIds
    private static readonly ConcurrentDictionary<int, HashSet<string>> OnlineStaffConnections = new();

    // Tên group cố định cho toàn bộ nhân viên hỗ trợ
    public const string StaffGroupName = "Group_SupportStaff";

    private int GetCurrentUserId()
    {
        var idClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    private string GetCurrentUserRole()
    {
        return Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        // Nếu là Staff thì tự động đưa vào group nhận thông báo hàng đợi và cập nhật danh sách trực tuyến
        if (role == nameof(UserRole.Staff))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, StaffGroupName);

            OnlineStaffConnections.AddOrUpdate(
                userId,
                new HashSet<string> { Context.ConnectionId },
                (_, connections) =>
                {
                    lock (connections)
                    {
                        connections.Add(Context.ConnectionId);
                    }
                    return connections;
                });

            // Báo cho các staff khác biết có nhân sự vừa vào ca trực
            await Clients.Group(StaffGroupName).SendAsync("StaffOnlineStatusChanged", userId, true);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        if (role == nameof(UserRole.Staff))
        {
            if (OnlineStaffConnections.TryGetValue(userId, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(Context.ConnectionId);
                    if (connections.Count == 0)
                    {
                        OnlineStaffConnections.TryRemove(userId, out _);
                    }
                }
            }

            // Nếu nhân viên không còn bất kỳ connection nào mở, báo offline
            if (!OnlineStaffConnections.ContainsKey(userId))
            {
                await Clients.Group(StaffGroupName).SendAsync("StaffOnlineStatusChanged", userId, false);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    // ==========================================
    // QUẢN LÝ PHÒNG CHAT (ROOM MANAGEMENT)
    // ==========================================

    /// <summary>
    /// Tham gia vào phòng chat của một phiên cụ thể (Dùng cho cả Khách hàng và Staff phụ trách)
    /// </summary>
    public async Task JoinSessionRoom(int sessionId)
    {
        string roomName = GetSessionGroupName(sessionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
    }

    /// <summary>
    /// Rời khỏi phòng chat của một phiên
    /// </summary>
    public async Task LeaveSessionRoom(int sessionId)
    {
        string roomName = GetSessionGroupName(sessionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
    }

    /// <summary>
    /// Lấy danh sách ID các nhân viên đang trực tuyến (phục vụ modal chuyển phiên - A2 UC24)
    /// </summary>
    public Task<List<int>> GetOnlineStaffIds()
    {
        var onlineIds = OnlineStaffConnections.Keys.ToList();
        return Task.FromResult(onlineIds);
    }

    // ==========================================
    // PHÁT TÍN HIỆU THỜI GIAN THỰC (EVENT BROADCASTING)
    // ==========================================

    /// <summary>
    /// Gửi tin nhắn mới tới toàn bộ người trong phòng chat của phiên
    /// </summary>
    public async Task BroadcastMessageToSession(int sessionId, ChatMessageDto message)
    {
        string roomName = GetSessionGroupName(sessionId);
        await Clients.Group(roomName).SendAsync("ReceiveMessage", message);
    }

    /// <summary>
    /// Thông báo phiên vừa được nhân viên tiếp nhận:
    /// - Gửi cho khách hàng trong phòng chat biết
    /// - Gửi cho toàn bộ Staff trong hàng đợi để cập nhật tab Pending -> Active
    /// </summary>
    public async Task BroadcastSessionAccepted(int sessionId, ChatSessionEventDto eventDto)
    {
        string roomName = GetSessionGroupName(sessionId);

        // Báo vào phòng chat của khách
        await Clients.Group(roomName).SendAsync("SessionAccepted", eventDto);

        // Báo cho toàn bộ nhân viên cập nhật danh sách hàng đợi
        await Clients.Group(StaffGroupName).SendAsync("QueueSessionAccepted", sessionId, eventDto.ActorId);
    }

    /// <summary>
    /// Thông báo phiên được chuyển giao cho nhân viên khác
    /// </summary>
    public async Task BroadcastSessionTransferred(int sessionId, ChatSessionEventDto eventDto)
    {
        string roomName = GetSessionGroupName(sessionId);
        await Clients.Group(roomName).SendAsync("SessionTransferred", eventDto);
        await Clients.Group(StaffGroupName).SendAsync("QueueSessionUpdated", sessionId);
    }

    /// <summary>
    /// Thông báo nhân viên rời phiên, đưa phiên quay lại tab Chờ (Pending)
    /// </summary>
    public async Task BroadcastSessionLeft(int sessionId, ChatSessionEventDto eventDto)
    {
        string roomName = GetSessionGroupName(sessionId);
        await Clients.Group(roomName).SendAsync("SessionLeft", eventDto);
        await Clients.Group(StaffGroupName).SendAsync("QueueSessionRevertedToPending", sessionId);
    }

    /// <summary>
    /// Thông báo phiên kết thúc (khóa khung chat ở cả hai đầu)
    /// </summary>
    public async Task BroadcastSessionClosed(int sessionId, ChatSessionEventDto eventDto)
    {
        string roomName = GetSessionGroupName(sessionId);
        await Clients.Group(roomName).SendAsync("SessionClosed", eventDto);
        await Clients.Group(StaffGroupName).SendAsync("QueueSessionClosed", sessionId);
    }

    public static string GetSessionGroupName(int sessionId) => $"Group_Session_{sessionId}";
}