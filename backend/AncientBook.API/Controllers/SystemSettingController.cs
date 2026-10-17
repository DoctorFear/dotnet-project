using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;

namespace AncientBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ISystemSettingService _settingService;

        public SystemSettingsController(ISystemSettingService settingService)
        {
            _settingService = settingService;
        }

        // Lấy cấu hình cài đặt vận hành hiện tại.
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var result = await _settingService.GetSettingsAsync();
            return Ok(result);
        }

        // Cập nhật các tham số cài đặt hệ thống.
        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] SystemSettingsDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                await _settingService.UpdateSettingsAsync(dto, userId, HttpContext.Connection.RemoteIpAddress?.ToString());
                return Ok(new { message = "Cập nhật cài đặt hệ thống thành công!" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Khôi phục các tham số cài đặt về mặc định.
        [HttpPost("restore-default")]
        public async Task<IActionResult> RestoreDefault()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                await _settingService.RestoreDefaultSettingsAsync(userId, HttpContext.Connection.RemoteIpAddress?.ToString());
                return Ok(new { message = "Khôi phục cài đặt mặc định thành công!" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
