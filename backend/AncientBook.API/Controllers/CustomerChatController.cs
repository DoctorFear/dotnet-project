using AncientBook.API.Hubs;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.DTOs.Chat;
using AncientBook.Application.Interfaces;
using AncientBook.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace AncientBook.API.Controllers;

public class FileUploadRequestDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
}

[ApiController]
[Route("api/chat")]
[Authorize]
public class CustomerChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IHubContext<LiveChatHub> _hubContext;

    public CustomerChatController(
        IChatService chatService,
        IFileStorageService fileStorageService,
        IHubContext<LiveChatHub> hubContext)
    {
        _chatService = chatService;
        _fileStorageService = fileStorageService;
        _hubContext = hubContext;
    }

    private int GetCurrentCustomerId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    /// <summary>
    /// UC23 - Bước 1, 2, 3 & A1: Mở widget chat, lấy hoặc khởi tạo phiên chat hiện tại kèm timeline lịch sử.
    /// </summary>
    [HttpGet("my-session")]
    public async Task<IActionResult> GetOrCreateSession()
    {
        int customerId = GetCurrentCustomerId();
        var session = await _chatService.GetOrCreateCustomerSessionAsync(customerId);
        return Ok(session);
    }

    /// <summary>
    /// UC23 - Bước 4, 5, 6, 7: Khách hàng gửi tin nhắn (văn bản và/hoặc ảnh đính kèm).
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/messages")]
    public async Task<IActionResult> SendMessage(int sessionId, [FromBody] SendMessageRequestDto request)
    {
        int customerId = GetCurrentCustomerId();
        try
        {
            var messageDto = await _chatService.SendCustomerMessageAsync(customerId, sessionId, request);

            // Phát tín hiệu SignalR tới phòng chat của phiên
            string sessionGroupName = LiveChatHub.GetSessionGroupName(sessionId);
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("ReceiveMessage", messageDto);

            // Báo cho toàn bộ Staff trong hàng đợi để cập nhật bản xem trước tin nhắn mới nhất
            await _hubContext.Clients.Group(LiveChatHub.StaffGroupName).SendAsync("QueueMessageReceived", sessionId, messageDto.Content ?? "[Hình ảnh]");

            return Ok(messageDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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
    /// UC23 - Luồng A3 & BR04: Tải ảnh đính kèm lên Dropbox (chỉ chấp nhận ảnh, tối đa 5MB).
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
            string fileUrl = await _fileStorageService.SaveFileAsync(file, "chat_customer");
            return Ok(new { url = fileUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// UC23 - Bước 2: Khách hàng mở widget chat, đánh dấu toàn bộ tin nhắn tư vấn là đã đọc (tắt chấm đỏ).
    /// </summary>
    [HttpPost("sessions/{sessionId:int}/mark-read")]
    public async Task<IActionResult> MarkAsRead(int sessionId)
    {
        int customerId = GetCurrentCustomerId();
        await _chatService.MarkAsReadByCustomerAsync(customerId, sessionId);
        return NoContent();
    }
}