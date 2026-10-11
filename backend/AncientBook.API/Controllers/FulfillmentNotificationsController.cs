using System.Security.Claims;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers;

[ApiController]
[Route("api/fulfillment-notifications")]
[Authorize(Roles = "Member,Staff,Admin")]
public class FulfillmentNotificationsController(IWorkflowReadService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int page = 1, int pageSize = 20)
    {
        if (!int.TryParse(User.FindFirst("UserId")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        return Ok(await service.GetNotificationsAsync(userId, User.IsInRole("Staff") || User.IsInRole("Admin"), page, pageSize));
    }

    [HttpGet("bonus-ebooks")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> BonusEbooks()
    {
        if (!int.TryParse(User.FindFirst("UserId")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        return Ok(await service.GetBonusEbooksAsync(userId));
    }

    [HttpGet("bonus-ebooks/{bookId:int}/editions/{editionId:int}/content")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> BonusEbookContent(int bookId, int editionId,
        [FromServices] IFileStorageService storage, CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirst("UserId")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();
        var content = await service.GetBonusEbookContentAsync(userId, bookId, editionId, ct);
        if (content == null)
            return NotFound(new { message = "Không có quyền đọc hoặc ấn bản E-Book chưa được xuất bản." });
        var stream = await storage.GetFileStreamAsync(content.DropboxPath, ct);
        Response.Headers.CacheControl = "private, no-store";
        return File(stream, content.ContentType, enableRangeProcessing: stream.CanSeek);
    }
}
