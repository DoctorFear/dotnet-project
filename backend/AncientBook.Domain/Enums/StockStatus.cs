namespace AncientBook.Domain.Enums
{
    // Trạng thái tồn kho của sách
    public enum StockStatus
    {
        InStock = 1,    // Còn hàng
        LowStock = 2,   // Sắp hết hàng (dưới ngưỡng cảnh báo)
        OutOfStock = 3  // Hết hàng
    }
}