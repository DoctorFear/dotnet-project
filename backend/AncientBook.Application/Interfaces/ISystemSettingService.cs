using System.Threading.Tasks;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    // Interface xử lý Cài đặt hệ thống 4 tham số 
    public interface ISystemSettingService
    {
        Task<SystemSettingsDto> GetSettingsAsync();
        Task<bool> UpdateSettingsAsync(SystemSettingsDto dto, int currentUserId);
        Task<bool> RestoreDefaultSettingsAsync(int currentUserId);
    }
}
