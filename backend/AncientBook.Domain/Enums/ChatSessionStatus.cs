namespace AncientBook.Domain.Enums;

public enum ChatSessionStatus
{
    Pending = 1,    // Đang chờ tiếp nhận
    Active = 2,     // Đang xử lý (đã có nhân viên phụ trách)
    Closed = 3      // Đã kết thúc
}