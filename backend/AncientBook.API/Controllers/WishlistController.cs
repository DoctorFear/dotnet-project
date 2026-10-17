using System.Security.Claims;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AncientBook.API.Controllers;

[ApiController]
[Route("api/wishlist")]
[Authorize(Roles = "Member")]
public class WishlistController(IWishlistService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await service.GetAsync(UserId));

    [HttpPut("{bookId:int}")]
    public async Task<IActionResult> Add(int bookId)
    {
        try { await service.AddAsync(UserId, bookId); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{bookId:int}")]
    public async Task<IActionResult> Remove(int bookId)
    {
        await service.RemoveAsync(UserId, bookId);
        return NoContent();
    }
}
