using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

public class WorkflowReadService(IWorkflowDbContext db) : IWorkflowReadService
{
    public async Task<PagedResult<WorkflowNotificationDto>> GetNotificationsAsync(int userId, bool staff, int page, int pageSize)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Set<FulfillmentNotification>().AsNoTracking()
            .Where(n => staff ? n.Audience == "Staff" : n.Audience == "Member" && n.UserId == userId);
        var count = await query.CountAsync();
        var items = await query.OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(n => new WorkflowNotificationDto(n.Id, n.OrderId, n.Message, n.CreatedAt)).ToListAsync();
        return new(items, count, page, pageSize);
    }

    // UC19: Quyền đọc có hiệu lực khi transaction hoàn thành và thanh toán đơn sách vật lý được commit.
    private IQueryable<OrderItem> BonusPurchases(int userId) => db.Set<OrderItem>().AsNoTracking()
        .Where(i => i.Order!.UserId == userId && i.Order.Status == OrderStatus.Completed && i.Order.IsPaid
            && i.PurchaseType == PurchaseType.Physical && i.Book!.IsEBookAvailable);

    public async Task<List<BonusEbookDto>> GetBonusEbooksAsync(int userId)
    {
        var books = await BonusPurchases(userId)
            .Select(i => new BonusEbookDto(i.BookId, i.Book!.Title, i.OrderId)).Distinct().ToListAsync();
        if (books.Count == 0) return books;
        var bookIds = books.Select(b => b.BookId).Distinct().ToArray();
        var editions = await db.Set<EbookEdition>().AsNoTracking()
            .Where(e => bookIds.Contains(e.BookId) && e.Status == EditionPublishStatus.Published
                && e.DropboxPath != "" && (e.Format == EbookFormat.Pdf || e.Format == EbookFormat.Epub))
            .OrderBy(e => e.Id)
            .Select(e => new { e.BookId, e.Id, e.FileTitle, e.Format }).ToListAsync();
        return books.Select(b => b with
        {
            Editions = editions.Where(e => e.BookId == b.BookId)
                .Select(e => new BonusEbookEditionDto(e.Id, e.FileTitle, e.Format.ToString(),
                    $"/api/fulfillment-notifications/bonus-ebooks/{b.BookId}/editions/{e.Id}/content"))
                .ToList()
        }).ToList();
    }

    public async Task<BonusEbookContent?> GetBonusEbookContentAsync(int userId, int bookId, int editionId, CancellationToken ct = default)
    {
        // Kiểm tra quyền sở hữu, thanh toán, trạng thái đơn và ấn bản trước khi truy cập file.
        var edition = await db.Set<EbookEdition>().AsNoTracking()
            .Where(e => e.Id == editionId && e.BookId == bookId && e.Status == EditionPublishStatus.Published
                && e.DropboxPath != "" && (e.Format == EbookFormat.Pdf || e.Format == EbookFormat.Epub)
                && BonusPurchases(userId).Any(i => i.BookId == e.BookId))
            .Select(e => new { e.DropboxPath, e.Format }).SingleOrDefaultAsync(ct);
        return edition == null ? null : new(edition.DropboxPath,
            edition.Format == EbookFormat.Pdf ? "application/pdf" : "application/epub+zip");
    }
}
