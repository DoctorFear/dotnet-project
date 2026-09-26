using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IReportPdfExporter
    {
        byte[] Export(DashboardReportDto report);
    }
}
