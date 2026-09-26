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
    [Authorize(Roles = "Admin,Staff")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ISystemSettingService _settingService;

        public SystemSettingsController(ISystemSettingService settingService)
        {
            _settingService = settingService;
        }

        // Lấy thông tin 4 tham số cấu hình cài đặt vận hành hiện tại (UC23)
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var result = await _settingService.GetSettingsAsync();
            return Ok(result);
        }

        // Cập nhật 4 tham số cài đặt hệ thống (UC23)
        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] SystemSettingsDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                await _settingService.UpdateSettingsAsync(dto, userId);
                return Ok(new { message = "Cập nhật cài đặt hệ thống thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Khôi phục tham số cài đặt về mặc định (UC23)
        [HttpPost("restore-default")]
        public async Task<IActionResult> RestoreDefault()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                await _settingService.RestoreDefaultSettingsAsync(userId);
                return Ok(new { message = "Khôi phục cài đặt mặc định thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
