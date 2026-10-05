namespace AncientBook.Domain.Enums;

public enum ChatEventType
{
    Created = 1,        // Khách mở phiên
    Accepted = 2,       // Staff tiếp nhận phiên
    Transferred = 3,    // Staff chuyển phiên cho Staff khác
    Left = 4,           // Staff rời phiên đưa về hàng đợi
    Closed = 5          // Staff đóng phiên kết thúc tư vấn
}