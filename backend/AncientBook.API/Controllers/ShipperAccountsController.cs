using System.Security.Claims;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers;

[ApiController]
[Route("api/shipper-accounts")]
[Authorize(Roles = "Admin")]
public class ShipperAccountsController(IDeliveryService service) : ControllerBase
{
    [HttpPut("{shipperId}")]
    public async Task<IActionResult> Link(int shipperId, LinkShipperAccountRequest request)
    {
        if (!int.TryParse(User.FindFirst("UserId")?.Value ?? User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId))
            return Unauthorized();
        try
        {
            await service.LinkShipperAccountAsync(shipperId, request.UserId, actorId);
            return Ok(new { message = "Đã liên kết tài khoản với hồ sơ Shipper." });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
