using System;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    // DTO dữ liệu báo cáo thống kê doanh thu và sản phẩm 
    public class DashboardReportDto
    {
        public int TotalBooks { get; set; }
        public int TotalSellingBooks { get; set; }
        public int TotalLowStockBooks { get; set; }
        public int LowStockThreshold { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<TopSellingBookDto> TopBooks { get; set; } = new List<TopSellingBookDto>();
    }

    public class TopSellingBookDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SoldQuantity { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
