using System;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    // Quản lý Cài đặt hệ thống 4 tham số 
    public class SystemSetting : BaseEntity
    {
        // Khóa cấu hình (LowStockThreshold, MaxRedeemPoint, MemberDiscountRates, MaxReturnDays)
        public string SettingKey { get; set; } = string.Empty;

        // Giá trị cấu hình (Lưu chuỗi/JSON)
        public string SettingValue { get; set; } = string.Empty;

        // Kiểu dữ liệu tham số (Int, Decimal, Json)
        public string DataType { get; set; } = "String";

        // Diễn giải ý nghĩa tham số
        public string? Description { get; set; } = string.Empty;
    }
}