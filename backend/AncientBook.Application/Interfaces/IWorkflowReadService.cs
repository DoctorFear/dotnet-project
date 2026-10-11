using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces;

public interface IWorkflowReadService
{
    Task<PagedResult<WorkflowNotificationDto>> GetNotificationsAsync(int userId, bool staff, int page, int pageSize);
    Task<List<BonusEbookDto>> GetBonusEbooksAsync(int userId);
    Task<BonusEbookContent?> GetBonusEbookContentAsync(int userId, int bookId, int editionId, CancellationToken ct = default);
}
