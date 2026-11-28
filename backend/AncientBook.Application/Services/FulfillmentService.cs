using System.Data;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

public class FulfillmentService : IFulfillmentService
{
    private readonly IWorkflowDbContext _db;
    public FulfillmentService(IWorkflowDbContext db) => _db = db;

    public async Task<PagedResult<FulfillmentPendingItem>> GetPendingOrdersAsync(FulfillmentPendingQuery query)
    {
        query.PageNumber = Math.Max(1, query.PageNumber);
        query.PageSize = Math.Clamp(query.PageSize, 1, 100);
        var orders = _db.Set<Order>().AsNoTracking().Where(o => o.Status == OrderStatus.Confirmed
            && o.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical));
        if (query.FromDate > query.ToDate) throw new InvalidOperationException("Khoảng ngày không hợp lệ.");
        if (query.FromDate.HasValue) orders = orders.Where(o => o.OrderDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) orders = orders.Where(o => o.OrderDate <= query.ToDate.Value);
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim();
            if (keyword.StartsWith("ORD-", StringComparison.OrdinalIgnoreCase)) keyword = keyword[4..];
            var hasOrderId = int.TryParse(keyword, out var orderId);
            orders = orders.Where(o => hasOrderId && o.Id == orderId
                || !hasOrderId && o.User != null && o.User.FullName.Contains(keyword));
        }
        var count = await orders.CountAsync();
        var items = await orders.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id)
            .Skip((query.PageNumber - 1) * query.PageSize).Take(query.PageSize)
            .Select(o => new FulfillmentPendingItem
            {
                OrderId = o.Id, CustomerName = o.User != null ? o.User.FullName : "N/A",
                OrderDate = o.OrderDate, FinalAmount = o.FinalAmount, Status = o.Status,
                ShippingCarrier = o.ShippingCarrier,
                DeliveryPriority = o.DeliveryPriority,
                TotalItems = o.OrderItems.Where(i => i.PurchaseType == PurchaseType.Physical).Sum(i => i.Quantity),
                PackingIssue = o.PackingIssue,
                PackedAt = _db.Set<OrderStatusHistory>().Where(h => h.OrderId == o.Id
                        && h.FromStatus == OrderStatus.Confirmed && h.ToStatus == OrderStatus.Prepared)
                    .OrderByDescending(h => h.ChangedAt).ThenByDescending(h => h.Id)
                    .Select(h => (DateTime?)h.ChangedAt).FirstOrDefault(),
                PackedBy = _db.Set<OrderStatusHistory>().Where(h => h.OrderId == o.Id
                        && h.FromStatus == OrderStatus.Confirmed && h.ToStatus == OrderStatus.Prepared)
                    .OrderByDescending(h => h.ChangedAt).ThenByDescending(h => h.Id)
                    .Select(h => h.ChangedBy).FirstOrDefault()
            }).ToListAsync();
        return new(items, count, query.PageNumber, query.PageSize);
    }

    public async Task<FulfillmentDetailResponse> GetOrderDetailAsync(int orderId)
    {
        var order = await _db.Set<Order>().AsNoTracking().Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(i => i.Book).ThenInclude(b => b!.Inventory)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        var packing = await ValidatePackingAsync(order, allowPreparedRead: true);
        return new FulfillmentDetailResponse
        {
            OrderId = order.Id, OrderDate = order.OrderDate, Status = order.Status,
            CustomerName = order.User?.FullName ?? "N/A",
            ReceiverPhone = order.User?.PhoneNumber, ShippingAddress = order.ShippingAddress,
            ShippingCarrier = order.ShippingCarrier, DeliveryPriority = order.DeliveryPriority,
            DeliveryNote = order.DeliveryNote, WaybillCode = string.IsNullOrWhiteSpace(order.WaybillCode)
                ? BuildWaybillCode(order) : order.WaybillCode,
            FinalAmount = order.FinalAmount, PaymentMethod = order.PaymentMethod, IsPaid = order.IsPaid,
            PackingIssue = order.PackingIssue, PackedAt = packing?.PackedAt, PackedBy = packing?.PackedBy,
            Items = order.OrderItems.Where(i => i.PurchaseType == PurchaseType.Physical)
                .GroupBy(i => i.BookId)
                .Select(group =>
                {
                    var first = group.First();
                    var shelfLocation = first.Book?.Inventory?.ShelfLocation;
                    return new FulfillmentItemDetail
                    {
                        BookId = first.BookId,
                        BookTitle = first.Book?.Title ?? "N/A",
                        Isbn = first.Book?.Isbn ?? string.Empty,
                        ShelfLocation = string.IsNullOrWhiteSpace(shelfLocation)
                            ? "Kệ chờ phân bổ" : shelfLocation,
                        BookCover = first.Book?.CoverImg,
                        Quantity = group.Sum(item => item.Quantity),
                        UnitPrice = first.UnitPrice
                    };
                }).ToList()
        };
    }

    public async Task<bool> ConfirmPackingAsync(int orderId, string staffUsername, PackOrderRequest request)
    {
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().Include(o => o.OrderItems).ThenInclude(i => i.Book)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        await ValidatePackingAsync(order, staffUsername);
        if (request == null)
            throw new InvalidOperationException("Thiếu kết quả kiểm tra sách trước khi đóng gói.");
        if (!string.IsNullOrWhiteSpace(request.Note) && request.Note.Trim().Length > 500)
            throw new InvalidOperationException("Ghi chú đóng gói tối đa 500 ký tự.");

        var expectedItems = order.OrderItems
            .Where(item => item.PurchaseType == PurchaseType.Physical)
            .GroupBy(item => item.BookId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
        var expectedCodes = order.OrderItems
            .Where(item => item.PurchaseType == PurchaseType.Physical)
            .GroupBy(item => item.BookId)
            .ToDictionary(group => group.Key,
                group => NormalizeScanCode(group.First().Book?.Isbn ?? $"BOOK-{group.Key}"));
        var verifiedItems = request.VerifiedItems ?? new List<PackingVerificationItem>();
        if (verifiedItems.Any(item => item.BookId <= 0 || item.VerifiedQuantity <= 0)
            || verifiedItems.GroupBy(item => item.BookId).Any(group => group.Count() != 1)
            || verifiedItems.Count != expectedItems.Count
            || verifiedItems.Any(item => !expectedItems.TryGetValue(item.BookId, out var quantity)
                || quantity != item.VerifiedQuantity
                || !item.VisualInspectionPassed
                || item.ScannedCodes == null || item.ScannedCodes.Count != quantity
                || item.ScannedCodes.Any(code => !MatchesBookCode(code, item.BookId, expectedCodes[item.BookId]))))
            throw new InvalidOperationException(
                "Checklist chưa xác minh đủ số lượng bằng mã ISBN/Book ID và ngoại quan từng cuốn trong đơn.");

        var verificationSnapshot = verifiedItems.OrderBy(item => item.BookId)
            .Select(item => new { item.BookId, item.VerifiedQuantity, item.ScannedCodes, item.VisualInspectionPassed }).ToList();
        var previous = order.Status;
        var packingIssue = order.PackingIssue;
        order.Status = OrderStatus.Prepared;
        order.PackingIssue = null;
        if (string.IsNullOrWhiteSpace(order.WaybillCode))
            order.WaybillCode = BuildWaybillCode(order);
        if (string.IsNullOrWhiteSpace(order.ShippingCarrier)) order.ShippingCarrier = "AncientBook Delivery";
        if (string.IsNullOrWhiteSpace(order.DeliveryPriority)) order.DeliveryPriority = "Standard";
        order.UpdatedBy = staffUsername;
        var actorId = await ActorIdAsync(staffUsername);
        WorkflowSupport.StatusHistory(_db, order, previous, staffUsername, request.Note?.Trim());
        if (!string.IsNullOrWhiteSpace(packingIssue))
            WorkflowSupport.Audit(_db, "PackingIssueResolved", "Order", orderId,
                new { PackingIssue = packingIssue }, new { PackingIssue = (string?)null }, actorId,
                "Sự cố được xử lý sau khi nhân viên xác minh lại đầy đủ từng cuốn.");
        WorkflowSupport.Audit(_db, "PackingCompleted", "Order", orderId,
            new { Status = previous, PackingIssue = packingIssue },
            new { order.Status, VerifiedItems = verificationSnapshot, Note = request.Note?.Trim() }, actorId,
            $"Đã xác minh {verificationSnapshot.Sum(item => item.VerifiedQuantity)} cuốn trước khi đóng gói.");
        WorkflowSupport.Notify(_db, $"Đơn #{orderId} đã đóng gói xong, chờ phân công Shipper.", orderId);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    public async Task<bool> ReportPackingIssueAsync(int orderId, string staffUsername, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Length > 1000)
            throw new InvalidOperationException("Vui lòng nhập lý do sự cố kho (tối đa 1.000 ký tự).");
        await using var tx = await _db.BeginWorkflowTransactionAsync();
        await WorkflowSupport.LockOrderAsync(_db, orderId);
        var order = await _db.Set<Order>().Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
        await ValidatePackingAsync(order, staffUsername);
        var old = order.PackingIssue;
        order.PackingIssue = reason.Trim();
        order.UpdatedBy = staffUsername;
        WorkflowSupport.Audit(_db, "PackingIssue", "Order", orderId, new { PackingIssue = old },
            new { order.PackingIssue }, await ActorIdAsync(staffUsername));
        var message = $"Sự cố kho đơn #{orderId}: {order.PackingIssue}";
        WorkflowSupport.Notify(_db, message[..Math.Min(1000, message.Length)], orderId);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    private static string BuildWaybillCode(Order order) =>
        $"AB-{order.OrderDate:yyyyMMdd}-{order.Id:D8}";

    private static string NormalizeScanCode(string value) =>
        new string(value.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());

    private static bool MatchesBookCode(string scannedCode, int bookId, string expectedIsbn)
    {
        var normalized = NormalizeScanCode(scannedCode ?? string.Empty);
        return normalized.Length > 0 && (normalized == expectedIsbn
            || normalized == NormalizeScanCode(bookId.ToString())
            || normalized == NormalizeScanCode($"BOOK-{bookId}"));
    }

    private Task<int?> ActorIdAsync(string username) => _db.Set<User>()
        .Where(u => u.Username == username).Select(u => (int?)u.Id).FirstOrDefaultAsync();

    private async Task<PackingMetadata?> ValidatePackingAsync(
        Order order, string? staffUsername = null, bool allowPreparedRead = false)
    {
        if (order.Status == OrderStatus.Confirmed)
        {
            if (!order.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical))
                throw new InvalidOperationException("Chỉ đóng gói đơn có sách vật lý.");
            return await LatestPackingMetadataAsync(order.Id);
        }

        if (order.Status == OrderStatus.Failed)
        {
            var failure = await _db.Set<OrderStatusHistory>().AsNoTracking()
                .Where(h => h.OrderId == order.Id && h.ToStatus == OrderStatus.Failed)
                .OrderByDescending(h => h.ChangedAt).ThenByDescending(h => h.Id)
                .Select(h => new FailureMetadata { Note = h.Note })
                .FirstOrDefaultAsync();
            if (string.Equals(failure?.Note, "Khách hủy đơn hàng", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    "Đơn hàng đã được khách hàng hủy trước khi đóng gói. Không tiếp tục xuất kho; vui lòng làm mới danh sách.");
            throw new InvalidOperationException(
                "Đơn hàng đã chuyển sang trạng thái thất bại và không còn được phép đóng gói. Vui lòng làm mới danh sách.");
        }

        if (order.Status == OrderStatus.Prepared)
        {
            var packing = await LatestPackingMetadataAsync(order.Id);
            if (allowPreparedRead && staffUsername == null) return packing;
            var packedAt = packing == null ? string.Empty : $" lúc {packing.PackedAt:dd/MM/yyyy HH:mm}";
            var packedBy = string.IsNullOrWhiteSpace(packing?.PackedBy) ? null : packing.PackedBy;
            if (packedBy != null && string.Equals(packedBy, staffUsername, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Bạn đã đóng gói đơn hàng này{packedAt}. Vui lòng làm mới danh sách.");
            if (staffUsername != null)
                throw new InvalidOperationException(packedBy == null
                    ? "Đơn hàng đã được một nhân viên khác đóng gói. Vui lòng làm mới danh sách."
                    : $"Đơn hàng đã được nhân viên khác ({packedBy}) đóng gói{packedAt}. Vui lòng làm mới danh sách.");
            throw new InvalidOperationException(packedBy == null
                ? "Đơn hàng đã được đóng gói. Vui lòng làm mới danh sách."
                : $"Đơn hàng đã được đóng gói bởi {packedBy}{packedAt}. Vui lòng làm mới danh sách.");
        }

        throw new InvalidOperationException(
            $"Đơn hàng đang ở trạng thái {order.Status} và không còn được phép đóng gói. Vui lòng làm mới danh sách.");
    }

    private Task<PackingMetadata?> LatestPackingMetadataAsync(int orderId) =>
        _db.Set<OrderStatusHistory>().AsNoTracking()
            .Where(h => h.OrderId == orderId && h.FromStatus == OrderStatus.Confirmed
                && h.ToStatus == OrderStatus.Prepared)
            .OrderByDescending(h => h.ChangedAt).ThenByDescending(h => h.Id)
            .Select(h => new PackingMetadata { PackedAt = h.ChangedAt, PackedBy = h.ChangedBy })
            .FirstOrDefaultAsync();

    private sealed class PackingMetadata
    {
        public DateTime PackedAt { get; init; }
        public string? PackedBy { get; init; }
    }

    private sealed class FailureMetadata
    {
        public string? Note { get; init; }
    }
}
