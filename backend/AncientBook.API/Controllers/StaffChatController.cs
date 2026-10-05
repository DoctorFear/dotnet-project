using AncientBook.API.Hubs;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.DTOs.Chat;
using AncientBook.Application.Interfaces;
using AncientBook.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace AncientBook.API.Controllers;

[ApiController]
[Route("api/staff/chat")]
[Authorize(Roles = "Staff")]
public class StaffChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IHubContext<LiveChatHub> _hubContext;

    public StaffChatController(
        IChatService chatService,
        IFileStorageService fileStorageService,
        IHubContext<LiveChatHub> hubContext)
    {
        _chatService = chatService;
        _fileStorageService = fileStorageService;
        _hubContext = hubContext;
    }

    private int GetCurrentStaffId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    /// <summary>
    /// UC24 - Bước 2: Lấy danh sách hàng đợi các phiên theo 3 tab (Pending, Active, Closed) kèm phân trang.
    /// </summary>
    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue([FromQuery] ChatQueueFilterDto filter)
    {
        var (items, totalCount) = await _chatService.GetQueueSessionsAsync(filter);
        return Ok(new
        {
            items,
            totalCount,
            pageNumber = filter.PageNumber,
            pageSize = filter.PageSize
        });
    }

    /// <summary>
    /// UC24 - Bước 2, 6: Lấy chi tiết phiên chat, timeline trao đổi và thông tin khách hàng ở cột phải.
    /// </summary>
    [HttpGet("sessions/{sessionId:int}")]
    public async Task<IActionResult> GetSessionDetail(int sessionId)
    {
        try
        {
            var (session, timeline) = await _chatService.GetStaffSessionDetailAsync(sessionId);
            return Ok(new { session, timeline });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24 - Bước 3, 4, 5: Nhân viên bấm tiếp nhận độc quyền phiên chat (Kiểm tra xung đột E1).
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/accept")]
    public async Task<IActionResult> AcceptSession(int sessionId)
    {
        int staffId = GetCurrentStaffId();
        try
        {
            var eventDto = await _chatService.AcceptSessionAsync(staffId, sessionId);

            string sessionGroupName = LiveChatHub.GetSessionGroupName(sessionId);

            // Báo vào phòng chat của khách hàng để mở khóa khung chat
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("SessionAccepted", eventDto);

            // Báo cho toàn thể Staff trong hàng đợi chuyển phiên từ tab Chờ -> Đang xử lý
            await _hubContext.Clients.Group(LiveChatHub.StaffGroupName).SendAsync("QueueSessionAccepted", sessionId, staffId);

            return Ok(eventDto);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // Báo lỗi xung đột nếu phiên đã bị nhận trước (E1 UC24)
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24 - Bước 6, 7, 8: Nhân viên phụ trách gửi phản hồi tới khách hàng.
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/messages")]
    public async Task<IActionResult> SendMessage(int sessionId, [FromBody] SendMessageRequestDto request)
    {
        int staffId = GetCurrentStaffId();
        try
        {
            var messageDto = await _chatService.SendStaffMessageAsync(staffId, sessionId, request);

            string sessionGroupName = LiveChatHub.GetSessionGroupName(sessionId);

            // Gửi tin nhắn đến khách hàng dưới danh nghĩa "Tư vấn viên" (BR03 UC24)
            var customerMessagePayload = new ChatMessageDto
            {
                Id = messageDto.Id,
                ChatSessionId = messageDto.ChatSessionId,
                SenderId = messageDto.SenderId,
                SenderName = "Tư vấn viên",
                SenderRole = messageDto.SenderRole,
                Content = messageDto.Content,
                AttachmentUrl = messageDto.AttachmentUrl,
                IsRead = false,
                CreatedAt = messageDto.CreatedAt
            };

            await _hubContext.Clients.Group(sessionGroupName).SendAsync("ReceiveMessage", customerMessagePayload);

            return Ok(messageDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24 - Luồng A2: Chuyển giao phiên hỗ trợ cho nhân viên trực tuyến khác trong ca trực.
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/transfer")]
    public async Task<IActionResult> TransferSession(int sessionId, [FromBody] TransferSessionRequestDto request)
    {
        int staffId = GetCurrentStaffId();
        try
        {
            var eventDto = await _chatService.TransferSessionAsync(staffId, sessionId, request);

            string sessionGroupName = LiveChatHub.GetSessionGroupName(sessionId);
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("SessionTransferred", eventDto);
            await _hubContext.Clients.Group(LiveChatHub.StaffGroupName).SendAsync("QueueSessionUpdated", sessionId);

            return Ok(eventDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24 - Luồng A3: Nhân viên rời phiên, đưa phiên quay lại tab Đang chờ.
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/leave")]
    public async Task<IActionResult> LeaveSession(int sessionId)
    {
        int staffId = GetCurrentStaffId();
        try
        {
            var eventDto = await _chatService.LeaveSessionAsync(staffId, sessionId);

            string sessionGroupName = LiveChatHub.GetSessionGroupName(sessionId);
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("SessionLeft", eventDto);
            await _hubContext.Clients.Group(LiveChatHub.StaffGroupName).SendAsync("QueueSessionRevertedToPending", sessionId);

            return Ok(eventDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24 - Luồng A4: Đóng và kết thúc phiên hỗ trợ.
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/close")]
    public async Task<IActionResult> CloseSession(int sessionId)
    {
        int staffId = GetCurrentStaffId();
        try
        {
            var eventDto = await _chatService.CloseSessionAsync(staffId, sessionId);

            string sessionGroupName = LiveChatHub.GetSessionGroupName(sessionId);
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("SessionClosed", eventDto);
            await _hubContext.Clients.Group(LiveChatHub.StaffGroupName).SendAsync("QueueSessionClosed", sessionId);

            return Ok(eventDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24 - Luồng A6: Cập nhật ghi chú nội bộ về khách hàng.
    /// </summary>
    [HttpPut("sessions/{sessionId:int}/note")]
    public async Task<IActionResult> UpdateInternalNote(int sessionId, [FromBody] UpdateSessionNoteRequestDto request)
    {
        try
        {
            await _chatService.UpdateInternalNoteAsync(sessionId, request);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24: Nhân viên tải ảnh đính kèm lên Dropbox khi tư vấn.
    /// </summary>
    [HttpPost("attachments")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAttachment([FromForm] FileUploadRequestDto request)
    {
        var file = request?.File;
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn tệp hình ảnh để tải lên." });
        }

        try
        {
            string fileUrl = await _fileStorageService.SaveFileAsync(file, "chat_staff");
            return Ok(new { url = fileUrl });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC24: Đánh dấu tin nhắn của khách là đã đọc khi nhân viên mở xem phiên.
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/mark-read")]
    public async Task<IActionResult> MarkAsRead(int sessionId)
    {
        int staffId = GetCurrentStaffId();
        await _chatService.MarkAsReadByStaffAsync(staffId, sessionId);
        return NoContent();
    }
}