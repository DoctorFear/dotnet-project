using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    public interface IReportRepository
    {
        Task<DashboardReportDto> GetDashboardAsync(ReportFilterDto filter, int threshold);
        Task<AncientBook.Application.Common.PagedResult<LowStockBookDto>> GetLowStockBooksAsync(ReportFilterDto filter, int threshold, int page, int pageSize);
    }
}
