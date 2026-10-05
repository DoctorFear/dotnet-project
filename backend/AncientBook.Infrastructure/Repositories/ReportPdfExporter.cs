using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AncientBook.Infrastructure.Repositories
{
    public class ReportPdfExporter : IReportPdfExporter
    {
        public byte[] Export(DashboardReportDto report)
        {
            return Document.Create(document =>
            {
                document.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(32);
                    page.DefaultTextStyle(text => text.FontSize(11));
                    page.Header().Text("Báo cáo thống kê AncientBook").FontSize(20).Bold();
                    page.Content().Column(column =>
                    {
                        column.Spacing(12);
                        column.Item().Text($"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}");
                        column.Item().Text($"Tổng đầu sách: {report.TotalBooks}");
                        column.Item().Text($"Sách đang kinh doanh: {report.TotalSellingBooks}");
                        column.Item().Text($"Sách sắp hết (ngưỡng {report.LowStockThreshold}): {report.TotalLowStockBooks}");
                        column.Item().Text($"Tổng doanh thu: {report.TotalRevenue:N0} VNĐ").Bold();
                        column.Item().Text("Top sách bán chạy").FontSize(14).Bold();
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(50);
                                columns.RelativeColumn();
                                columns.ConstantColumn(80);
                                columns.ConstantColumn(110);
                            });
                            table.Header(header =>
                            {
                                header.Cell().Text("STT").Bold();
                                header.Cell().Text("Tên sách").Bold();
                                header.Cell().Text("Đã bán").Bold();
                                header.Cell().Text("Doanh thu").Bold();
                            });

                            for (var index = 0; index < report.TopBooks.Count; index++)
                            {
                                var book = report.TopBooks[index];
                                table.Cell().Text((index + 1).ToString());
                                table.Cell().Text(book.Title);
                                table.Cell().Text(book.SoldQuantity.ToString());
                                table.Cell().Text($"{book.TotalAmount:N0} VNĐ");
                            }
                        });
                    });
                    page.Footer().AlignCenter().Text("AncientBook");
                });
            }).GeneratePdf();
        }
    }
}
