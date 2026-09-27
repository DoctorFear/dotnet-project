using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
    public class SystemSettingService : ISystemSettingService
    {
        private readonly ISystemSettingRepository _systemSettingRepository;

        public SystemSettingService(ISystemSettingRepository systemSettingRepository)
        {
            _systemSettingRepository = systemSettingRepository;
        }

        // Lấy thông tin 4 tham số cài đặt hệ thống 
        public async Task<SystemSettingsDto> GetSettingsAsync()
        {
            var settings = await _systemSettingRepository.GetAllAsync();

            var dto = new SystemSettingsDto();
            foreach (var s in settings)
            {
                switch (s.SettingKey)
                {
                    case "LOW_STOCK_THRESHOLD":
                        if (int.TryParse(s.SettingValue, out int lowStock)) dto.LowStockThreshold = lowStock;
                        break;
                    case "POINT_RATE_BRONZE":
                        if (int.TryParse(s.SettingValue, out int bronze)) dto.PointRateBronze = bronze;
                        break;
                    case "POINT_RATE_SILVER":
                        if (int.TryParse(s.SettingValue, out int silver)) dto.PointRateSilver = silver;
                        break;
                    case "POINT_RATE_GOLD":
                        if (int.TryParse(s.SettingValue, out int gold)) dto.PointRateGold = gold;
                        break;
                    case "MAX_POINTS_PER_ORDER":
                        if (int.TryParse(s.SettingValue, out int maxPts)) dto.MaxPointsPerOrder = maxPts;
                        break;
                    case "MAX_RETURN_DAYS":
                        if (int.TryParse(s.SettingValue, out int maxReturn)) dto.MaxReturnDays = maxReturn;
                        break;
                    case "MEMBER_UPGRADE_SPENDING_BRONZE":
                        if (decimal.TryParse(s.SettingValue, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal bronzeUpgrade)) dto.MemberUpgradeSpendingBronze = bronzeUpgrade;
                        break;
                    case "MEMBER_UPGRADE_SPENDING_SILVER":
                        if (decimal.TryParse(s.SettingValue, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal silverUpgrade)) dto.MemberUpgradeSpendingSilver = silverUpgrade;
                        break;
                    case "MEMBER_UPGRADE_SPENDING_GOLD":
                        if (decimal.TryParse(s.SettingValue, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal goldUpgrade)) dto.MemberUpgradeSpendingGold = goldUpgrade;
                        break;
                }
            }
            return dto;
        }

        // Cập nhật 4 tham số cài đặt hệ thống 
        public async Task<bool> UpdateSettingsAsync(SystemSettingsDto dto, int currentUserId)
        {
            if (dto.LowStockThreshold < 0 || dto.MaxPointsPerOrder < 0 || dto.MaxReturnDays < 1 ||
                dto.PointRateBronze < 0 || dto.PointRateBronze > 100 ||
                dto.PointRateSilver < 0 || dto.PointRateSilver > 100 ||
                dto.PointRateGold < 0 || dto.PointRateGold > 100 ||
                dto.MemberUpgradeSpendingBronze < 0 ||
                dto.MemberUpgradeSpendingSilver < dto.MemberUpgradeSpendingBronze ||
                dto.MemberUpgradeSpendingGold < dto.MemberUpgradeSpendingSilver)
            {
                throw new Exception("Dữ liệu cài đặt hệ thống không hợp lệ!");
            }

            var dict = new Dictionary<string, (string Value, string DataType)>
            {
                { "LOW_STOCK_THRESHOLD", (dto.LowStockThreshold.ToString(CultureInfo.InvariantCulture), "INT") },
                { "POINT_RATE_BRONZE", (dto.PointRateBronze.ToString(CultureInfo.InvariantCulture), "INT") },
                { "POINT_RATE_SILVER", (dto.PointRateSilver.ToString(CultureInfo.InvariantCulture), "INT") },
                { "POINT_RATE_GOLD", (dto.PointRateGold.ToString(CultureInfo.InvariantCulture), "INT") },
                { "MAX_POINTS_PER_ORDER", (dto.MaxPointsPerOrder.ToString(CultureInfo.InvariantCulture), "INT") },
                { "MAX_RETURN_DAYS", (dto.MaxReturnDays.ToString(CultureInfo.InvariantCulture), "INT") },
                { "MEMBER_UPGRADE_SPENDING_BRONZE", (dto.MemberUpgradeSpendingBronze.ToString(CultureInfo.InvariantCulture), "DECIMAL") },
                { "MEMBER_UPGRADE_SPENDING_SILVER", (dto.MemberUpgradeSpendingSilver.ToString(CultureInfo.InvariantCulture), "DECIMAL") },
                { "MEMBER_UPGRADE_SPENDING_GOLD", (dto.MemberUpgradeSpendingGold.ToString(CultureInfo.InvariantCulture), "DECIMAL") }
            };

            foreach (var item in dict)
            {
                var setting = await _systemSettingRepository.GetByKeyAsync(item.Key);
                if (setting == null)
                {
                    setting = new SystemSetting
                    {
                        SettingKey = item.Key,
                        SettingValue = item.Value.Value,
                        DataType = item.Value.DataType,
                        CreatedBy = currentUserId.ToString()
                    };
                    _systemSettingRepository.Add(setting);
                    _systemSettingRepository.AddAuditLog(new AuditLog
                    {
                        UserId = currentUserId,
                        Action = "Tạo cài đặt hệ thống",
                        EntityName = "SystemSetting",
                        RecordId = item.Key,
                        Details = $"Giá trị mới: {item.Value.Value}"
                    });
                }
                else
                {
                    if (setting.SettingValue == item.Value.Value)
                        continue;

                    var previousValue = setting.SettingValue;
                    setting.SettingValue = item.Value.Value;
                    setting.DataType = item.Value.DataType;
                    setting.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                    setting.UpdatedBy = currentUserId.ToString();
                    _systemSettingRepository.AddAuditLog(new AuditLog
                    {
                        UserId = currentUserId,
                        Action = "Cập nhật cài đặt hệ thống",
                        EntityName = "SystemSetting",
                        RecordId = item.Key,
                        Details = $"Giá trị cũ: {previousValue}; Giá trị mới: {item.Value.Value}"
                    });
                }
            }

            await _systemSettingRepository.SaveChangesAsync();
            return true;
        }

        // Khôi phục tham số mặc định 
        public async Task<bool> RestoreDefaultSettingsAsync(int currentUserId)
        {
            var defaultDto = new SystemSettingsDto();
            return await UpdateSettingsAsync(defaultDto, currentUserId);
        }
    }
}
