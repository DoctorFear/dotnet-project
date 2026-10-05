// AncientBook.API/Controllers/AdminUsersController.cs
using AncientBook.Application.DTOs.User;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")] // BR01: Chỉ Admin mới có quyền truy cập
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUsersController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        private int CurrentAdminId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // 1. Lấy danh sách tài khoản kèm tìm kiếm, lọc & phân trang (Main Flow, A1)
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] UserFilterDto filter)
        {
            var result = await _adminUserService.GetUsersAsync(filter);
            return Ok(result);
        }

        // 2. Tạo tài khoản nhân sự mới
        [HttpPost]
        public async Task<IActionResult> CreateInternalUser([FromBody] CreateInternalUserRequestDto request)
        {
            var result = await _adminUserService.CreateInternalUserAsync(CurrentAdminId, request);
            if (!result.Success) // <-- Đổi IsSuccess thành Success
                return BadRequest(result);

            return Ok(result);
        }

        // 3. Phân vai trò nội bộ
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] ChangeUserRoleRequestDto request)
        {
            var result = await _adminUserService.UpdateRoleAsync(CurrentAdminId, id, request);
            if (!result.Success) // <-- Đổi IsSuccess thành Success
                return BadRequest(result);

            return Ok(result);
        }

        // 4. Khóa hoặc Mở khóa tài khoản
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(int id, [FromBody] ToggleUserStatusRequestDto request)
        {
            var result = await _adminUserService.ToggleStatusAsync(CurrentAdminId, id, request);
            if (!result.Success) // <-- Đổi IsSuccess thành Success
                return BadRequest(result);

            return Ok(result);
        }
    }
}