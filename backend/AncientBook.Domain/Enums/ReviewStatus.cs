namespace AncientBook.Domain.Enums
{
    // Trạng thái đánh giá (UC21)
    public enum ReviewStatus
    {
        Pending = 0,    // Chờ duyệt
        Approved = 1,   // Đã duyệt (hiển thị)
        Rejected = 2,   // Từ chối
        Hidden = 3      // Ẩn (do báo cáo)
    }
}