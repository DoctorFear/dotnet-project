using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using System.Text.Json;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Common;
using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services
{
    public class SystemSettingService : ISystemSettingService
    {
        private readonly ISystemSettingRepository _systemSettingRepository;
        private readonly IAuditLogService _auditLogs;
        private readonly IWorkflowDbContext _workflow;

        public SystemSettingService(ISystemSettingRepository systemSettingRepository, IAuditLogService auditLogs, IWorkflowDbContext workflow)
        {
            _systemSettingRepository = systemSettingRepository;
            _auditLogs = auditLogs;
            _workflow = workflow;
        }

        // Lấy các tham số cài đặt hệ thống.
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

        // Lưu toàn bộ cấu hình và nhật ký trong cùng giao dịch.
        public Task<bool> UpdateSettingsAsync(SystemSettingsDto dto, int currentUserId, string? ipAddress = null)
        {
            return SaveSettingsAsync(dto, currentUserId, ipAddress, "Cập nhật cài đặt hệ thống");
        }

        // Khôi phục tham số mặc định.
        public Task<bool> RestoreDefaultSettingsAsync(int currentUserId, string? ipAddress = null)
        {
            var defaultDto = new SystemSettingsDto();
            return SaveSettingsAsync(defaultDto, currentUserId, ipAddress, "Khôi phục cài đặt mặc định");
        }

        // Kiểm tra ràng buộc và ghi nhận thay đổi cấu hình cùng Audit Log.
        private async Task<bool> SaveSettingsAsync(SystemSettingsDto dto, int currentUserId, string? ipAddress, string auditAction)
        {
            if (dto.LowStockThreshold < 1 || dto.LowStockThreshold > 100)
            {
                throw new ArgumentException("Ngưỡng cảnh báo sách sắp hết phải là số nguyên từ 1 đến 100.");
            }

            if (dto.MaxReturnDays < 1)
            {
                throw new ArgumentException("Thời hạn tối đa yêu cầu hoàn hàng phải lớn hơn hoặc bằng 1 ngày.");
            }

            if (dto.MaxPointsPerOrder < 0 || dto.MaxPointsPerOrder > 1000)
            {
                throw new ArgumentException("Mức điểm sử dụng tối đa phải nằm trong khoảng từ 0 đến 1.000 F-Point.");
            }

            if (dto.PointRateBronze < 0 || dto.PointRateBronze > 100 ||
                dto.PointRateSilver < 0 || dto.PointRateSilver > 100 ||
                dto.PointRateGold < 0 || dto.PointRateGold > 100)
            {
                throw new ArgumentException("Tỉ lệ tích điểm phải nằm trong khoảng từ 0% đến 100%.");
            }

            if (dto.PointRateSilver < dto.PointRateBronze || dto.PointRateGold < dto.PointRateSilver)
            {
                throw new ArgumentException("Tỉ lệ tích điểm phải đảm bảo Hạng Vàng >= Hạng Bạc >= Hạng Đồng.");
            }

            if (dto.MemberUpgradeSpendingBronze < 0 ||
                dto.MemberUpgradeSpendingSilver < dto.MemberUpgradeSpendingBronze ||
                dto.MemberUpgradeSpendingGold < dto.MemberUpgradeSpendingSilver)
            {
                throw new ArgumentException("Ngưỡng chi tiêu thăng hạng không được âm và phải tăng dần (Vàng >= Bạc >= Đồng).");
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

            await using var transaction = _workflow.Database.CurrentTransaction == null
                ? await _workflow.Database.BeginTransactionAsync()
                : null;

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
                    await _auditLogs.LogAsync(
                        "Tạo cài đặt hệ thống",
                        "SystemSettings",
                        "SystemSetting",
                        item.Key,
                        newValues: JsonSerializer.Serialize(new { SettingValue = item.Value.Value }),
                        details: $"Giá trị mới: {item.Value.Value}",
                        userId: currentUserId,
                        ipAddress: ipAddress);
                }
                else
                {
                    if (setting.SettingValue == item.Value.Value)
                    {
                        continue;
                    }

                    var previousValue = setting.SettingValue;
                    setting.SettingValue = item.Value.Value;
                    setting.DataType = item.Value.DataType;
                    setting.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                    setting.UpdatedBy = currentUserId.ToString();
                    await _auditLogs.LogAsync(
                        auditAction,
                        "SystemSettings",
                        "SystemSetting",
                        item.Key,
                        oldValues: JsonSerializer.Serialize(new { SettingValue = previousValue }),
                        newValues: JsonSerializer.Serialize(new { SettingValue = item.Value.Value }),
                        details: $"Giá trị cũ: {previousValue}; Giá trị mới: {item.Value.Value}",
                        userId: currentUserId,
                        ipAddress: ipAddress);
                }
            }

            await _systemSettingRepository.SaveChangesAsync();
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            return true;
        }
    }
}
