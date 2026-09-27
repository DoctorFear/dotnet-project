using AncientBook.Application.DTOs.User;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AncientBook.API.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")] // BR01: Chỉ Quản trị viên mới có quyền truy cập
public class AdminUserController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;

    public AdminUserController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : 0;
    }

    /// <summary>
    /// A1: Tìm kiếm, lọc và phân trang danh sách tài khoản
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterDto filter)
    {
        var result = await _adminUserService.GetUsersAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// A2: Tạo tài khoản nhân sự mới (Admin, Staff, Shipper)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateInternalUser([FromBody] CreateInternalUserRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var adminId = GetCurrentUserId();
        var result = await _adminUserService.CreateInternalUserAsync(adminId, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Main Flow: Phân quyền / luân chuyển vai trò nhân sự
    /// </summary>
    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] ChangeUserRoleRequestDto request)
    {
        var adminId = GetCurrentUserId();
        var result = await _adminUserService.UpdateRoleAsync(adminId, id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// A3: Khóa hoặc Mở khóa tài khoản người dùng
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleUserStatusRequestDto request)
    {
        var adminId = GetCurrentUserId();
        var result = await _adminUserService.ToggleStatusAsync(adminId, id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}