using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AncientBook.Infrastructure.Repositories;

public class ReportPdfExporter : IReportPdfExporter
{
    public byte[] Export(DashboardReportDto report) => Document.Create(document =>
    {
        document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(32);
            page.DefaultTextStyle(text => text.FontSize(10));
            page.Header().PaddingBottom(15).Text("ancientBOOK | Thống kê & Báo cáo").FontSize(18).Bold().FontColor("#103E9F");
            page.Content().Column(column =>
            {
                column.Spacing(10);
                column.Item().Text($"Kỳ báo cáo: {report.FromDate:dd/MM/yyyy} đến {report.ToDate:dd/MM/yyyy}").Bold();
                column.Item().Text($"Xuất lúc {report.GeneratedAt:dd/MM/yyyy HH:mm} (giờ Việt Nam) | Người xuất: {report.ExportedBy}");
                var type = report.PurchaseType switch { "physical" => "Sách giấy", "rental" => "Thuê đọc", _ => "Tất cả" };
                column.Item().Text($"Thể loại: {report.Category ?? "Tất cả"} | NXB: {report.Publisher ?? "Tất cả"} | Hình thức: {type}");
                column.Item().Text("Doanh thu sau giảm giá của đơn đã thanh toán và hoàn thành, theo ngày đặt đơn.");
                column.Item().Background("#F2F6FF").Padding(10).Column(summary =>
                {
                    summary.Spacing(4);
                    summary.Item().Text($"Doanh thu: {Money(report.TotalRevenue)} | Đơn hoàn thành: {report.CompletedOrders}").Bold();
                    summary.Item().Text($"Sách giấy: {report.PhysicalQuantity} cuốn / {Money(report.PhysicalRevenue)}");
                    summary.Item().Text($"Thuê đọc: {report.RentalQuantity} lượt / {Money(report.RentalRevenue)}");
                    summary.Item().Text($"Đầu sách: {report.TotalBooks} | Đang kinh doanh: {report.TotalSellingBooks}");
                    summary.Item().Text($"Tồn kho hiện tại: {report.TotalLowStockBooks} đầu sách giấy còn tối đa {report.LowStockThreshold} cuốn (gồm hết hàng).");
                });
                column.Item().Text("Top 10 sách theo số lượng bán và thuê").FontSize(13).Bold();
                if (report.TopBooks.Count == 0) column.Item().Text("Không có giao dịch trong kỳ.");
                else column.Item().Table(table =>
                {
                    table.ColumnsDefinition(c => { c.ConstantColumn(25); c.RelativeColumn(); c.ConstantColumn(42); c.ConstantColumn(42); c.ConstantColumn(95); });
                    table.Header(h => { Cell(h.Cell(), "#", true); Cell(h.Cell(), "Tên sách", true); Cell(h.Cell(), "Giấy", true); Cell(h.Cell(), "Thuê", true); Cell(h.Cell(), "Doanh thu", true); });
                    for (var i = 0; i < report.TopBooks.Count; i++)
                    {
                        var book = report.TopBooks[i];
                        Cell(table.Cell(), (i + 1).ToString()); Cell(table.Cell(), book.Title);
                        Cell(table.Cell(), book.SoldQuantity.ToString()); Cell(table.Cell(), book.RentalQuantity.ToString()); Cell(table.Cell(), Money(book.TotalAmount));
                    }
                });
                if (report.DetailedExport) ComposeDetails(column, report);
            });
            page.Footer().PaddingTop(12).AlignCenter().Text(text => { text.Span("AncientBook | Trang "); text.CurrentPageNumber(); text.Span(" / "); text.TotalPages(); });
        });
    }).GeneratePdf();

    internal static string Money(decimal value) => $"{value:N0} VNĐ";
    internal static void Cell(IContainer container, string text, bool header = false)
    {
        var cell = container.BorderBottom(0.5f).BorderColor("#D8E3F8").PaddingVertical(6).PaddingHorizontal(3);
        if (header) cell.Background("#F2F6FF").Text(text).Bold();
        else cell.Text(text);
    }

    private static void ComposeDetails(ColumnDescriptor column, DashboardReportDto report)
    {
        column.Item().Text("Doanh thu theo ngày").FontSize(13).Bold();
        column.Item().Table(table =>
        {
            table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.ConstantColumn(35); });
            table.Header(h => { Cell(h.Cell(), "Ngày", true); Cell(h.Cell(), "Sách giấy", true); Cell(h.Cell(), "Thuê đọc", true); Cell(h.Cell(), "Tổng", true); Cell(h.Cell(), "Đơn", true); });
            foreach (var day in report.RevenueTrend)
            {
                Cell(table.Cell(), day.Date.ToString("dd/MM/yyyy"));
                Cell(table.Cell(), Money(day.PhysicalRevenue));
                Cell(table.Cell(), Money(day.RentalRevenue));
                Cell(table.Cell(), Money(day.Revenue));
                Cell(table.Cell(), day.CompletedOrders.ToString());
            }
        });
        column.Item().Text("Toàn bộ sách giấy tại ngưỡng cảnh báo").FontSize(13).Bold();
        column.Item().Text($"Tồn kho tại {report.GeneratedAt:dd/MM/yyyy HH:mm}; không phụ thuộc kỳ doanh thu hoặc hình thức mua.");
        if (report.ExportInventory.Count == 0) column.Item().Text("Không có sách tại ngưỡng cảnh báo.");
        else column.Item().Table(table =>
        {
            table.ColumnsDefinition(c => { c.RelativeColumn(); c.ConstantColumn(120); c.ConstantColumn(40); });
            table.Header(h => { Cell(h.Cell(), "Tên sách", true); Cell(h.Cell(), "ISBN", true); Cell(h.Cell(), "Tồn", true); });
            foreach (var book in report.ExportInventory)
            {
                Cell(table.Cell(), book.Title); Cell(table.Cell(), book.Isbn); Cell(table.Cell(), book.StockCount.ToString());
            }
        });
    }
}
