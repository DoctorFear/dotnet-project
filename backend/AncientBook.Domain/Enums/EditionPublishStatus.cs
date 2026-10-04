namespace AncientBook.Domain.Enums
{
    public enum EditionPublishStatus
    {
        Draft = 0,         // Bản nháp (A1)
        Processing = 1,    // Đang bóc tách và nạp tri thức ngầm
        Published = 2,     // Đã phát hành chính thức
        Failed = 3         // Lỗi trong tiến trình nạp dữ liệu
    }
}