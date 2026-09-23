// Hàm lấy giờ Việt Nam chuẩn xác
public static class TimeZoneHelper
{
    public static DateTime GetVietnamTime()
    {
        // Lấy múi giờ Đông Dương (ICT - UTC+7)
        var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // Hoặc "Asia/Ho_Chi_Minh" trên Linux/Docker
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
    }
}