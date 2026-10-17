using System;
using System.Collections.Generic;
using AncientBook.Application.Common;

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
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string ExportedBy { get; set; } = string.Empty;
        public string PurchaseType { get; set; } = "all";
        public string? Category { get; set; }
        public string? Publisher { get; set; }
        public int CompletedOrders { get; set; }
        public int PhysicalQuantity { get; set; }
        public int RentalQuantity { get; set; }
        public decimal PhysicalRevenue { get; set; }
        public decimal RentalRevenue { get; set; }
        public List<RevenuePeriodDto> RevenueTrend { get; set; } = [];
        public PagedResult<TopSellingBookDto> TopBooksPage { get; set; } = new([], 0, 1, 5);
        public PagedResult<LowStockBookDto> LowStockBooksPage { get; set; } = new([], 0, 1, 5);
        public List<LowStockBookDto> ExportInventory { get; set; } = [];
        public bool DetailedExport { get; set; }
    }

    public class TopSellingBookDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SoldQuantity { get; set; }
        public decimal TotalAmount { get; set; }
        public int RentalQuantity { get; set; }
        public string? CoverImg { get; set; }
    }

    public class RevenuePeriodDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public decimal PhysicalRevenue { get; set; }
        public decimal RentalRevenue { get; set; }
        public int CompletedOrders { get; set; }
    }

    public class LowStockBookDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public string? CoverImg { get; set; }
        public int StockCount { get; set; }
    }

    public class ReportFilterDto
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? CategoryId { get; set; }
        public int? PublisherId { get; set; }
        public string? PurchaseType { get; set; } = "all";
        public int TopPage { get; set; } = 1;
        public int TopPageSize { get; set; } = 5;
        public int InventoryPage { get; set; } = 1;
        public int InventoryPageSize { get; set; } = 5;
    }
}
