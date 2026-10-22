using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Application.DTOs;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<OrderResponseDto?> GetOrderDtoByIdAsync(int orderId)
        {
            var result = await _context.Orders
                .Where(o => o.Id == orderId)
                .Select(o => new OrderResponseDto
                {
                    Id = o.Id,
                    OrderDate = o.OrderDate,
                    SubTotal = o.SubTotal,
                    DiscountAmount = o.DiscountAmount,
                    FinalAmount = o.FinalAmount,
                    ShippingAddress = o.ShippingAddress,
                    Status = o.Status,
                    IsPaid = o.IsPaid,
                    PayUrl = o.PayUrl,
                    PackingIssue = o.PackingIssue,
                    
                    User = o.User == null ? null : new OrderUserDto
                    {
                        Id = o.User.Id,
                        FullName = o.User.FullName,
                        Email = o.User.Email,
                        PhoneNumber = o.User.PhoneNumber
                    },

                    OrderItems = o.OrderItems.Select(oi => new OrderItemResponseDto
                    {
                        Id = oi.Id,
                        BookId = oi.BookId,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        PurchaseType = oi.PurchaseType,
                        RentalDuration = oi.RentalDuration,
                        RentalStartDate = oi.RentalStartDate,
                        RentalEndDate = oi.RentalEndDate,
                        
                        Book = oi.Book == null ? null : new OrderBookDto
                        {
                            Id = oi.Book.Id,
                            Isbn = oi.Book.Isbn,
                            Title = oi.Book.Title,
                            Author = oi.Book.Author,
                            CoverImg = oi.Book.CoverImg
                        }
                    }).ToList()
                })
                .FirstOrDefaultAsync();
            if (result != null) await PopulateHistoryAsync(new List<OrderResponseDto> { result });
            return result;
        }

        public async Task<List<Order>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.Shipper)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Order>> GetByShipperIdAsync(int shipperId)
        {
            return await _context.Orders
                .Where(o => o.ShipperId == shipperId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task AddAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
        }

        public async Task UpdateAsync(Order order)
        {
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();
        }
        
        public async Task<bool> UpdateStatusAsync(int orderId, OrderStatus newStatus)
        {
            int rowsAffected = await _context.Orders
                .Where(o => o.Id == orderId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(o => o.Status, newStatus)
                    .SetProperty(o => o.UpdatedAt, TimeZoneHelper.GetVietnamTime())
                );

            return rowsAffected > 0;
        }

        public void Update(Order order)
        {
            _context.Orders.Update(order);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        // public async Task<(List<Order> items, int totalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? status, int? userId, string? searchKeyword)
        // {
        //     var query = _context.Orders.Include(o => o.OrderItems).ThenInclude(oi => oi.Book).AsQueryable();

        //     if (userId != null)
        //     {
        //         query = query.Where(o => o.UserId == userId.Value);
        //     }

        //     if (!string.IsNullOrWhiteSpace(status))
        //     {
        //         query = query.Where(o => o.Status.ToString() == status);
        //     }

        //     if (!string.IsNullOrWhiteSpace(searchKeyword))
        //     {
        //         searchKeyword = searchKeyword.Trim().ToLower();
                
        //         bool isNumeric = int.TryParse(searchKeyword, out int orderIdSearch);
                
        //         query = query.Where(o => 
        //             (isNumeric && o.Id == orderIdSearch) || 
        //             (o.ShippingAddress != null && o.ShippingAddress.ToLower().Contains(searchKeyword))
        //         );
        //     }

        //     int totalCount = await query.CountAsync();
        //     var items = await query
        //         .OrderByDescending(o => o.OrderDate)
        //         .Skip((pageIndex - 1) * pageSize)
        //         .Take(pageSize)
        //         .ToListAsync();

        //     return (items, totalCount);
        // }
        
        // Truy vấn danh sách đơn hàng theo điều kiện.
        public async Task<(List<OrderResponseDto> Items, int TotalCount)> GetPagedOrdersAsync(GetOrdersQuery query)
        {
            var dbQuery = _context.Orders.AsNoTracking().AsQueryable();

            if (query.UserId.HasValue)
            {
                dbQuery = dbQuery.Where(o => o.UserId == query.UserId.Value);
            }

            if (query.Status.HasValue)
            {
                dbQuery = dbQuery.Where(o => o.Status == query.Status.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
            {
                var keyword = query.SearchKeyword.Trim().ToLower();
                dbQuery = dbQuery.Where(o => 
                    (o.User != null && (o.User.Username.ToLower().Contains(keyword) || 
                                        o.User.Email.ToLower().Contains(keyword) || 
                                        o.User.FullName.ToLower().Contains(keyword))) ||
                    o.Id.ToString() == keyword
                );
            }

            // Lọc tên sách, ngày đặt, loại đơn và nhóm trạng thái.
            if (!string.IsNullOrWhiteSpace(query.BookTitle))
            {
                var bookTitle = query.BookTitle.ToLower();
                dbQuery = dbQuery.Where(o => o.OrderItems.Any(i => i.Book != null && i.Book.Title.ToLower().Contains(bookTitle)));
            }

            if (query.FromDate.HasValue)
            {
                var fromDate = query.FromDate.Value.Date;
                dbQuery = dbQuery.Where(o => o.OrderDate >= fromDate);
            }
            if (query.ToDate.HasValue)
            {
                var toDate = query.ToDate.Value.Date;
                dbQuery = dbQuery.Where(o => o.OrderDate.Date <= toDate);
            }

            if (query.OrderType == "physical")
            {
                dbQuery = dbQuery.Where(o => o.OrderItems.Any() && o.OrderItems.All(i => i.PurchaseType == PurchaseType.Physical));
            }
            else if (query.OrderType == "online")
            {
                dbQuery = dbQuery.Where(o => o.OrderItems.Any() && o.OrderItems.All(i => i.PurchaseType != PurchaseType.Physical));
            }
            else if (query.OrderType == "mixed")
            {
                dbQuery = dbQuery.Where(o => o.OrderItems.Any(i => i.PurchaseType == PurchaseType.Physical) && o.OrderItems.Any(i => i.PurchaseType != PurchaseType.Physical));
            }

            if (query.StatusGroup == "preparing")
            {
                dbQuery = dbQuery.Where(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Prepared);
            }
            else if (query.StatusGroup == "shipping")
            {
                dbQuery = dbQuery.Where(o => o.Status == OrderStatus.Shipping);
            }
            else if (query.StatusGroup == "completed")
            {
                dbQuery = dbQuery.Where(o => o.Status == OrderStatus.Completed || o.Status == OrderStatus.Failed);
            }
            else if (query.StatusGroup == "returns")
            {
                dbQuery = dbQuery.Where(o => o.Status == OrderStatus.ReturnRequested || o.Status == OrderStatus.ReturnApproved || o.Status == OrderStatus.Returned);
            }

            int totalCount = await dbQuery.CountAsync();

            // Sắp xếp đơn hàng trước khi phân trang.
            var sortedQuery = dbQuery.OrderByDescending(o => o.OrderDate).ThenByDescending(o => o.Id);
            if (query.SortBy == "oldest")
            {
                sortedQuery = dbQuery.OrderBy(o => o.OrderDate).ThenBy(o => o.Id);
            }
            else if (query.SortBy == "price_asc")
            {
                sortedQuery = dbQuery.OrderBy(o => o.FinalAmount).ThenByDescending(o => o.OrderDate).ThenByDescending(o => o.Id);
            }
            else if (query.SortBy == "price_desc")
            {
                sortedQuery = dbQuery.OrderByDescending(o => o.FinalAmount).ThenByDescending(o => o.OrderDate).ThenByDescending(o => o.Id);
            }

            var items = await sortedQuery
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(o => new OrderResponseDto
                {
                    Id = o.Id,
                    OrderDate = o.OrderDate,
                    SubTotal = o.SubTotal,
                    DiscountAmount = o.DiscountAmount,
                    FinalAmount = o.FinalAmount,
                    ShippingAddress = o.ShippingAddress,
                    Status = o.Status,
                    IsPaid = o.IsPaid,
                    PayUrl = o.PayUrl,
                    PackingIssue = o.PackingIssue,
                    
                    User = o.User == null ? null : new OrderUserDto
                    {
                        Id = o.User.Id,
                        FullName = o.User.FullName,
                        Email = o.User.Email,
                        PhoneNumber = o.User.PhoneNumber
                    },

                    OrderItems = o.OrderItems.Select(oi => new OrderItemResponseDto
                    {
                        Id = oi.Id,
                        BookId = oi.BookId,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        PurchaseType = oi.PurchaseType,
                        RentalDuration = oi.RentalDuration,
                        RentalStartDate = oi.RentalStartDate,
                        RentalEndDate = oi.RentalEndDate,
                        
                        Book = oi.Book == null ? null : new OrderBookDto
                        {
                            Id = oi.Book.Id,
                            Isbn = oi.Book.Isbn,
                            Title = oi.Book.Title,
                            Author = oi.Book.Author,
                            CoverImg = oi.Book.CoverImg
                        }
                    }).ToList()
                })
                .ToListAsync();

            await PopulateHistoryAsync(items);
            return (items, totalCount);
        }

        // Bổ sung dữ liệu đọc cho lịch sử đơn hàng, không thay đổi trạng thái nghiệp vụ.
        private async Task PopulateHistoryAsync(List<OrderResponseDto> orders)
        {
            if (orders.Count == 0) return;
            var ids = orders.Select(o => o.Id).ToArray();
            var sources = await _context.Orders.AsNoTracking().Where(o => ids.Contains(o.Id))
                .Select(o => new { o.Id, o.CreatedBy }).ToListAsync();
            var histories = await _context.OrderStatusHistories.AsNoTracking()
                .Where(h => ids.Contains(h.OrderId)).OrderBy(h => h.ChangedAt).ThenBy(h => h.Id).ToListAsync();
            var refunds = await _context.Refunds.AsNoTracking().Where(r => ids.Contains(r.OrderId)).ToListAsync();
            var reviews = await _context.BookReviews.AsNoTracking()
                .Where(r => r.OrderId.HasValue && ids.Contains(r.OrderId.Value)).ToListAsync();
            var failures = await _context.OrderFailureReasons.AsNoTracking().Include(f => f.FailureReason)
                .Where(f => ids.Contains(f.OrderId)).OrderByDescending(f => f.RecordedAt).ToListAsync();
            var settings = await _context.SystemSettings.AsNoTracking()
                .Where(s => s.SettingKey == "MAX_RETURN_DAYS" || s.SettingKey == "POINT_RATE_BRONZE").ToListAsync();
            var returnDays = int.TryParse(settings.FirstOrDefault(s => s.SettingKey == "MAX_RETURN_DAYS")?.SettingValue, out var days) && days > 0 ? days : 3;
            var pointRate = int.TryParse(settings.FirstOrDefault(s => s.SettingKey == "POINT_RATE_BRONZE")?.SettingValue, out var rate) ? rate : 5;
            foreach (var order in orders)
            {
                var source = sources.First(o => o.Id == order.Id).CreatedBy;
                if (source?.StartsWith("OrderSeeder:v1:", StringComparison.Ordinal) == true &&
                    int.TryParse(source["OrderSeeder:v1:".Length..], out var scenario)) order.PresentationScenario = scenario % 20;
                var history = histories.Where(h => h.OrderId == order.Id).ToList();
                order.CompletedAt = history.FirstOrDefault(h => h.ToStatus == OrderStatus.Completed)?.ChangedAt;
                order.ReturnDeadline = order.CompletedAt?.AddDays(returnDays);
                var paymentNote = history.FirstOrDefault(h => h.ToStatus == OrderStatus.Pending)?.Note;
                order.PaymentMethod = paymentNote?.Contains("MoMo", StringComparison.OrdinalIgnoreCase) == true ? "MoMo"
                    : paymentNote?.Contains("COD", StringComparison.OrdinalIgnoreCase) == true ? "COD" : null;
                order.FailureReason = history.LastOrDefault(h => h.ToStatus == OrderStatus.Failed)?.Note
                    ?? failures.FirstOrDefault(f => f.OrderId == order.Id)?.FailureReason?.ReasonText;
                var refund = refunds.FirstOrDefault(r => r.OrderId == order.Id);
                if (refund != null)
                {
                    var outcome = history.LastOrDefault(h => h.ToStatus == OrderStatus.Completed &&
                        (h.FromStatus == OrderStatus.ReturnRequested || h.FromStatus == OrderStatus.ReturnApproved));
                    order.ReturnInfo = new OrderReturnDto
                    {
                        Reason = refund.Reason, Description = refund.Description,
                        ImageUrls = refund.ImageUrls, VideoUrl = refund.VideoUrl,
                        Outcome = outcome == null ? null : outcome.FromStatus == OrderStatus.ReturnRequested ? "rejected" : "collection_failed",
                        OutcomeReason = outcome?.Note
                    };
                }
                order.Reviews = reviews.Where(r => r.OrderId == order.Id).Select(r => new OrderHistoryReviewDto
                { BookId = r.BookId, Rating = r.Rating, Content = r.Content, IsHidden = r.Status == ReviewStatus.Hidden }).ToList();
                order.RewardPoints = checked((int)decimal.Floor(order.FinalAmount * pointRate / 100m / 100m));
            }
        }
    }
}
