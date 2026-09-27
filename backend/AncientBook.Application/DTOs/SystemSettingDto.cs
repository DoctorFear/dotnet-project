namespace AncientBook.Application.DTOs
{
    // DTO hiển thị & cập nhật 4 tham số cài đặt chung
    public class SystemSettingsDto
    {
        public int LowStockThreshold { get; set; } = 5;
        public int PointRateBronze { get; set; } = 5;
        public int PointRateSilver { get; set; } = 10;
        public int PointRateGold { get; set; } = 15;
        public int MaxPointsPerOrder { get; set; } = 20000;
        public int MaxReturnDays { get; set; } = 7;
        public decimal MemberUpgradeSpendingBronze { get; set; } = 0;
        public decimal MemberUpgradeSpendingSilver { get; set; } = 1000000;
        public decimal MemberUpgradeSpendingGold { get; set; } = 5000000;
    }
}
