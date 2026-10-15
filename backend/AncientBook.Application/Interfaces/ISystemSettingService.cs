using System.Threading.Tasks;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    // Xử lý đọc, cập nhật và khôi phục cài đặt hệ thống.
    public interface ISystemSettingService
    {
        Task<SystemSettingsDto> GetSettingsAsync();
        Task<bool> UpdateSettingsAsync(SystemSettingsDto dto, int currentUserId, string? ipAddress = null);
        Task<bool> RestoreDefaultSettingsAsync(int currentUserId, string? ipAddress = null);
    }
}
