using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories;

public class ReportRepository(ApplicationDbContext context) : IReportRepository
{
    public async Task<DashboardReportDto> GetDashboardAsync(ReportFilterDto filter, int threshold)
    {
        var books = FilterBooks(filter);
        var lines = FilterLines(filter);
        var report = await lines.GroupBy(line => 1).Select(group => new DashboardReportDto
        {
            TotalRevenue = group.Sum(line => line.Revenue),
            PhysicalRevenue = group.Sum(line => line.Type == PurchaseType.Physical ? line.Revenue : 0),
            RentalRevenue = group.Sum(line => line.Type == PurchaseType.Rental ? line.Revenue : 0),
            PhysicalQuantity = group.Sum(line => line.Type == PurchaseType.Physical ? line.Quantity : 0),
            RentalQuantity = group.Sum(line => line.Type == PurchaseType.Rental ? line.Quantity : 0),
            CompletedOrders = group.Select(line => line.OrderId).Distinct().Count()
        }).FirstOrDefaultAsync() ?? new DashboardReportDto();
        report.TotalBooks = await books.CountAsync();
        report.TotalSellingBooks = await books.CountAsync(book => book.Status == BookStatus.Selling);
        report.LowStockThreshold = threshold;
        report.LowStockBooksPage = await GetLowStockBooksAsync(filter, threshold, filter.InventoryPage, filter.InventoryPageSize);
        report.TotalLowStockBooks = report.LowStockBooksPage.TotalCount;
        report.Category = filter.CategoryId.HasValue ? await context.Categories.Where(x => x.Id == filter.CategoryId).Select(x => x.Name).FirstOrDefaultAsync() : null;
        report.Publisher = filter.PublisherId.HasValue ? await context.Publishers.Where(x => x.Id == filter.PublisherId).Select(x => x.Name).FirstOrDefaultAsync() : null;
        report.RevenueTrend = await lines.GroupBy(line => line.Date).OrderBy(group => group.Key)
            .Select(group => new RevenuePeriodDto
            {
                Date = group.Key,
                Revenue = group.Sum(line => line.Revenue),
                PhysicalRevenue = group.Sum(line => line.Type == PurchaseType.Physical ? line.Revenue : 0),
                RentalRevenue = group.Sum(line => line.Type == PurchaseType.Rental ? line.Revenue : 0),
                CompletedOrders = group.Select(line => line.OrderId).Distinct().Count()
            }).ToListAsync();
        report.TopBooks = await lines.GroupBy(line => new { line.BookId, line.Title, line.CoverImg })
            .Select(group => new TopSellingBookDto
            {
                BookId = group.Key.BookId, Title = group.Key.Title, CoverImg = group.Key.CoverImg,
                SoldQuantity = group.Sum(line => line.Type == PurchaseType.Physical ? line.Quantity : 0),
                RentalQuantity = group.Sum(line => line.Type == PurchaseType.Rental ? line.Quantity : 0),
                TotalAmount = group.Sum(line => line.Revenue)
            }).OrderByDescending(book => book.SoldQuantity + book.RentalQuantity)
            .ThenByDescending(book => book.TotalAmount).ThenBy(book => book.BookId).Take(10).ToListAsync();
        var topPage = Math.Clamp(filter.TopPage, 1, Math.Max(1, (int)Math.Ceiling(report.TopBooks.Count / (double)filter.TopPageSize)));
        report.TopBooksPage = new(report.TopBooks.Skip((topPage - 1) * filter.TopPageSize).Take(filter.TopPageSize).ToList(), report.TopBooks.Count, topPage, filter.TopPageSize);
        return report;
    }

    public async Task<PagedResult<LowStockBookDto>> GetLowStockBooksAsync(ReportFilterDto filter, int threshold, int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var books = FilterBooks(filter).Where(book => book.IsPhysicalAvailable && book.StockCount <= threshold);
        var count = await books.CountAsync();
        page = Math.Clamp(page, 1, Math.Max(1, (int)Math.Ceiling(count / (double)pageSize)));
        var items = await books.OrderBy(book => book.StockCount).ThenBy(book => book.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(book => new LowStockBookDto { BookId = book.Id, Title = book.Title, Isbn = book.Isbn, CoverImg = book.CoverImg, StockCount = book.StockCount }).ToListAsync();
        return new(items, count, page, pageSize);
    }

    private IQueryable<Book> FilterBooks(ReportFilterDto filter)
    {
        var books = context.Books.AsNoTracking();
        if (filter.CategoryId.HasValue) books = books.Where(book => book.BookCategories.Any(category => category.CategoryId == filter.CategoryId));
        if (filter.PublisherId.HasValue) books = books.Where(book => book.PublisherId == filter.PublisherId);
        return books;
    }

    private IQueryable<ReportLine> FilterLines(ReportFilterDto filter)
    {
        var end = filter.ToDate!.Value.AddDays(1);
        var items = context.OrderItems.AsNoTracking().Where(item => item.Order!.IsPaid && item.Order.Status == OrderStatus.Completed &&
            item.Order.OrderDate >= filter.FromDate && item.Order.OrderDate < end);
        if (filter.CategoryId.HasValue) items = items.Where(item => item.Book!.BookCategories.Any(category => category.CategoryId == filter.CategoryId));
        if (filter.PublisherId.HasValue) items = items.Where(item => item.Book!.PublisherId == filter.PublisherId);
        if (filter.PurchaseType == "physical") items = items.Where(item => item.PurchaseType == PurchaseType.Physical);
        if (filter.PurchaseType == "rental") items = items.Where(item => item.PurchaseType == PurchaseType.Rental);
        // Phân bổ giảm giá theo giá trị dòng; lọc sách không cộng cả các dòng ngoài bộ lọc.
        return items.Select(item => new ReportLine
        {
            OrderId = item.OrderId, BookId = item.BookId, Title = item.Book!.Title, CoverImg = item.Book.CoverImg,
            Date = item.Order!.OrderDate.Date, Type = item.PurchaseType, Quantity = item.Quantity,
            Revenue = item.Order.SubTotal > 0 ? item.UnitPrice * item.Quantity * item.Order.FinalAmount / item.Order.SubTotal : 0
        });
    }

    private sealed class ReportLine
    {
        public int OrderId { get; set; }
        public int BookId { get; set; }
        public string Title { get; set; } = "";
        public string? CoverImg { get; set; }
        public DateTime Date { get; set; }
        public PurchaseType Type { get; set; }
        public int Quantity { get; set; }
        public decimal Revenue { get; set; }
    }
}
