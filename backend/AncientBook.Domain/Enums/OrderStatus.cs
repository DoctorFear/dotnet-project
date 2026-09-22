namespace AncientBook.Domain.Enums
{
    public enum OrderStatus
    {
        Pending = 1, // Chờ xác nhận
        Confirmed = 2, // Đã xác nhận
        Prepared = 3, // Đã chuẩn bị xong
        Shipping = 4, // Đang giao
        Completed = 5, // Hoàn thành
        Failed = 6, // Thất bại
        ReturnRequested = 7, // Chờ duyệt hoàn trả
        ReturnApproved = 8, //  Đã duyệt hoàn trả
        Returned = 9 // Hoàn trả thành công
    }
}