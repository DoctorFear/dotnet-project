using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace AncientBook.Application.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _bookRepository;
        private readonly ICategoryRepository _categories;
        private readonly IPublisherRepository _publishers;
        private readonly ISystemSettingRepository _settings;
        private readonly IAuditLogService _auditLogs;
        private readonly IWorkflowDbContext _workflow;
        private readonly IHttpContextAccessor? _http;

        public BookService(IBookRepository bookRepository, ICategoryRepository categories, IPublisherRepository publishers, ISystemSettingRepository settings, IAuditLogService auditLogs, IWorkflowDbContext workflow, IHttpContextAccessor? http = null)
        {
            _bookRepository = bookRepository;
            _categories = categories;
            _publishers = publishers;
            _settings = settings;
            _auditLogs = auditLogs;
            _workflow = workflow;
            _http = http;
        }

        // Năm xuất bản thực tế để bộ lọc không dùng danh sách cố định.
        public Task<List<int>> GetPublicationYearsAsync() => _bookRepository.GetBookListQuery()
            .Where(book => book.PublicationYear.HasValue).Select(book => book.PublicationYear!.Value)
            .Distinct().OrderByDescending(year => year).ToListAsync();

        // Tra cứu, lọc nâng cao và phân trang danh sách sách
        public async Task<PagedResult<BookListDto>> GetFilteredBooksAsync(BookFilterRequestDto filter)
        {
            if (filter.PageNumber < 1) filter.PageNumber = 1;
            if (filter.PageSize < 1) filter.PageSize = 12;
            if (filter.PageSize > 100) filter.PageSize = 100;

            var query = _bookRepository.GetBookListQuery();
            var threshold = await StockWarningPolicy.GetThresholdAsync(_settings);
            if (!string.IsNullOrWhiteSpace(filter.Author))
                query = query.Where(book => book.Author == filter.Author.Trim());

            // Lọc theo tên sách, tác giả, nhà xuất bản hoặc ISBN.
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var term = filter.SearchTerm.Trim().ToLower();
                query = query.Where(b => b.Title.ToLower().Contains(term) ||
                                         b.Author.ToLower().Contains(term) ||
                                         (b.PublisherEntity != null && b.PublisherEntity.Name.ToLower().Contains(term)) ||
                                         b.Isbn.ToLower().Contains(term));
            }

            // Lọc theo danh mục thể loại
            if (filter.CategoryIds != null && filter.CategoryIds.Any())
            {
                query = query.Where(b => b.BookCategories.Any(bc => filter.CategoryIds.Contains(bc.CategoryId)));
            }

            // Lọc theo Nhà xuất bản
            if (filter.PublisherIds != null && filter.PublisherIds.Any())
            {
                query = query.Where(b => b.PublisherId.HasValue && filter.PublisherIds.Contains(b.PublisherId.Value));
            }

            // Lọc theo khoảng giá vật lý
            if (filter.MinPrice.HasValue) query = query.Where(b => b.PhysicalPrice >= filter.MinPrice.Value);
            if (filter.MaxPrice.HasValue) query = query.Where(b => b.PhysicalPrice <= filter.MaxPrice.Value);
            if (filter.PublicationYear.HasValue) query = query.Where(b => b.PublicationYear == filter.PublicationYear.Value);
            if (filter.MinRating.HasValue) query = query.Where(b => b.Rating >= filter.MinRating.Value);
            if (filter.MaxRatingExclusive.HasValue) query = query.Where(b => b.Rating < filter.MaxRatingExclusive.Value);

            // Lọc theo trạng thái kinh doanh
            if (!string.IsNullOrWhiteSpace(filter.Status))
            {
                if (Enum.TryParse<BookStatus>(filter.Status, true, out var statusEnum))
                    query = query.Where(b => b.Status == statusEnum);
            }

            // Sắp xếp
            query = filter.SortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(b => b.PhysicalPrice).ThenBy(b => b.Id),
                "price_desc" => query.OrderByDescending(b => b.PhysicalPrice).ThenBy(b => b.Id),
                "rating" => query.OrderByDescending(b => b.Rating).ThenBy(b => b.Id),
                "bestseller" => query.OrderByDescending(b => b.OrderItems.Where(i => i.Order != null && i.Order.Status == OrderStatus.Completed && i.Order.IsPaid).Sum(i => (int?)i.Quantity) ?? 0).ThenByDescending(b => b.Id),
                _ => query.OrderByDescending(b => b.Id)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(b => new BookListDto
                {
                    Id = b.Id,
                    Isbn = b.Isbn,
                    Title = b.Title,
                    Author = b.Author,
                    PublisherId = b.PublisherId,
                    Publisher = b.PublisherEntity != null ? b.PublisherEntity.Name : null,
                    CategoryIds = b.BookCategories.Select(bc => bc.CategoryId).ToList(),
                    Categories = b.BookCategories.Select(bc => bc.Category!.Name).ToList(),
                    CoverImg = b.CoverImg,
                    IsPhysicalAvailable = b.IsPhysicalAvailable,
                    PhysicalPrice = b.PhysicalPrice,
                    IsEBookAvailable = b.IsEBookAvailable,
                    EBookPrice = b.EBookPrice,
                    IsRentalAvailable = b.IsRentalAvailable,
                    WeeklyRentalPrice = b.WeeklyRentalPrice,
                    MonthlyRentalPrice = b.MonthlyRentalPrice,
                    YearlyRentalPrice = b.YearlyRentalPrice,
                    Rating = b.Rating,
                    ReviewsCount = b.ReviewsCount,
                    StockStatus = StockWarningPolicy.GetStatus(b.IsPhysicalAvailable, b.StockCount, threshold),
                    StockCount = b.StockCount,
                    Status = b.Status.ToString().ToLower()
                })
                .ToListAsync();

            return new PagedResult<BookListDto>(items, totalCount, filter.PageNumber, filter.PageSize);
        }

        // Xem chi tiết sách và gallery ảnh 
        public async Task<BookDetailDto?> GetBookDetailByIdAsync(int id)
        {
            var b = await _bookRepository.GetDetailByIdAsync(id);

            if (b == null) return null;
            var threshold = await StockWarningPolicy.GetThresholdAsync(_settings);

            return new BookDetailDto
            {
                Id = b.Id,
                Isbn = b.Isbn,
                Title = b.Title,
                Author = b.Author,
                PublisherId = b.PublisherId,
                Publisher = b.PublisherEntity?.Name,
                CategoryIds = b.BookCategories.Select(bc => bc.CategoryId).ToList(),
                Categories = b.BookCategories.Select(bc => bc.Category!.Name).ToList(),
                CoverImg = b.CoverImg,
                IsPhysicalAvailable = b.IsPhysicalAvailable,
                PhysicalPrice = b.PhysicalPrice,
                IsEBookAvailable = b.IsEBookAvailable,
                EBookPrice = b.EBookPrice,
                IsRentalAvailable = b.IsRentalAvailable,
                WeeklyRentalPrice = b.WeeklyRentalPrice,
                MonthlyRentalPrice = b.MonthlyRentalPrice,
                YearlyRentalPrice = b.YearlyRentalPrice,
                Rating = b.Rating,
                ReviewsCount = b.ReviewsCount,
                StockStatus = StockWarningPolicy.GetStatus(b.IsPhysicalAvailable, b.StockCount, threshold),
                StockCount = b.StockCount,
                Status = b.Status.ToString().ToLower(),
                Pages = b.Pages,
                Weight = b.Weight,
                PublicationYear = b.PublicationYear,
                Description = b.Description,
                Language = b.Language,
                Dimensions = b.Dimensions,
                GalleryImages = b.BookImages.OrderBy(bi => bi.DisplayOrder).ThenBy(bi => bi.Id).Select(bi => bi.ImageUrl).ToList()
            };
        }

        // Thêm đầu sách mới - Tồn kho mặc định = 0 
        public async Task<BookDetailDto> CreateBookAsync(SaveBookDto dto, int currentUserId)
        {
            await ValidateAsync(dto);
            if (await _bookRepository.IsIsbnExistsAsync(dto.Isbn.Trim()))
                throw new Exception("Mã ISBN này đã tồn tại trên hệ thống!");

            if (!Enum.TryParse<BookStatus>(dto.Status, true, out var statusEnum))
                throw new Exception("Trạng thái kinh doanh không hợp lệ!");

            var book = new Book
            {
                Isbn = dto.Isbn.Trim(),
                Title = dto.Title.Trim(),
                Author = dto.Author.Trim(),
                PublisherId = dto.PublisherId,
                CoverImg = dto.CoverImg,
                IsPhysicalAvailable = dto.IsPhysicalAvailable,
                PhysicalPrice = dto.PhysicalPrice,
                IsEBookAvailable = dto.IsEBookAvailable,
                EBookPrice = dto.EBookPrice,
                IsRentalAvailable = dto.IsRentalAvailable,
                WeeklyRentalPrice = dto.WeeklyRentalPrice,
                MonthlyRentalPrice = dto.MonthlyRentalPrice,
                YearlyRentalPrice = dto.YearlyRentalPrice,
                StockCount = 0, // Mặc định = 0 khi tạo mới
                StockStatus = StockStatus.OutOfStock,
                Status = statusEnum,
                Pages = dto.Pages,
                Weight = dto.Weight,
                PublicationYear = dto.PublicationYear,
                Description = dto.Description,
                Language = dto.Language,
                Dimensions = dto.Dimensions,
                CreatedBy = currentUserId.ToString()
            };

            // Lưu danh mục N-N
            if (dto.CategoryIds != null && dto.CategoryIds.Any())
            {
                foreach (var catId in dto.CategoryIds)
                {
                    book.BookCategories.Add(new BookCategory { CategoryId = catId });
                }
            }

            // Lưu gallery ảnh phụ
            if (dto.GalleryImages != null && dto.GalleryImages.Any())
            {
                foreach (var (imgUrl, index) in dto.GalleryImages.Select((url, index) => (url, index)))
                {
                    book.BookImages.Add(new BookImage { ImageUrl = imgUrl, DisplayOrder = index });
                }
            }

            _bookRepository.Add(book);
            await SaveWithAuditAsync(book, "Create", null, currentUserId);

            return (await GetBookDetailByIdAsync(book.Id))!;
        }

        // Cập nhật thông tin sách - Khóa sửa ISBN và StockCount
        public async Task<BookDetailDto?> UpdateBookAsync(int id, SaveBookDto dto, int currentUserId)
        {
            await ValidateAsync(dto);
            var book = await _bookRepository.GetForUpdateAsync(id);

            if (book == null) return null;

            if (!Enum.TryParse<BookStatus>(dto.Status, true, out var statusEnum))
                throw new Exception("Trạng thái kinh doanh không hợp lệ!");

            var oldValues = Snapshot(book);
            book.Title = dto.Title.Trim();
            book.Author = dto.Author.Trim();
            book.PublisherId = dto.PublisherId;
            book.CoverImg = dto.CoverImg;
            book.IsPhysicalAvailable = dto.IsPhysicalAvailable;
            book.PhysicalPrice = dto.PhysicalPrice;
            book.IsEBookAvailable = dto.IsEBookAvailable;
            book.EBookPrice = dto.EBookPrice;
            book.IsRentalAvailable = dto.IsRentalAvailable;
            book.WeeklyRentalPrice = dto.WeeklyRentalPrice;
            book.MonthlyRentalPrice = dto.MonthlyRentalPrice;
            book.YearlyRentalPrice = dto.YearlyRentalPrice;
            book.Status = statusEnum;
            book.Pages = dto.Pages;
            book.Weight = dto.Weight;
            book.PublicationYear = dto.PublicationYear;
            book.Description = dto.Description;
            book.Language = dto.Language;
            book.Dimensions = dto.Dimensions;
            book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            book.UpdatedBy = currentUserId.ToString();

            // Cập nhật bảng trung gian danh mục N-N
            _bookRepository.RemoveBookCategories(book.BookCategories.ToList());
            book.BookCategories.Clear();
            if (dto.CategoryIds != null)
            {
                foreach (var catId in dto.CategoryIds)
                {
                    book.BookCategories.Add(new BookCategory { BookId = id, CategoryId = catId });
                }
            }

            // Cập nhật Gallery ảnh
            _bookRepository.RemoveBookImages(book.BookImages.ToList());
            book.BookImages.Clear();
            if (dto.GalleryImages != null)
            {
                foreach (var (imgUrl, index) in dto.GalleryImages.Select((url, index) => (url, index)))
                {
                    book.BookImages.Add(new BookImage { BookId = id, ImageUrl = imgUrl, DisplayOrder = index });
                }
            }

            await SaveWithAuditAsync(book, "Update", oldValues, currentUserId);
            return await GetBookDetailByIdAsync(id);
        }

        // Chuyển nhanh trạng thái kinh doanh sách 
        public async Task<bool> UpdateBookStatusAsync(int id, string status, int currentUserId)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return false;

            if (Enum.TryParse<BookStatus>(status, true, out var statusEnum) && Enum.IsDefined(statusEnum))
            {
                var oldValues = JsonSerializer.Serialize(new { Status = book.Status.ToString() });
                book.Status = statusEnum;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                book.UpdatedBy = currentUserId.ToString();
                await SaveWithAuditAsync(book, "Update", oldValues, currentUserId, JsonSerializer.Serialize(new { Status = book.Status.ToString() }));
                return true;
            }
            return false;
        }

        // Xóa sách - Nếu đã có đơn hàng thì chuyển sang 'Stopped'
        public async Task<bool> DeleteBookAsync(int id, int currentUserId)
        {
            var book = await _bookRepository.GetForDeleteAsync(id);
            if (book == null) return false;

            var oldValues = Snapshot(book);
            if (book.OrderItems.Any())
            {
                book.Status = BookStatus.Stopped;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                book.UpdatedBy = currentUserId.ToString();
                await SaveWithAuditAsync(book, "Update", oldValues, currentUserId);
                throw new Exception("Không thể xóa sách này vì đã phát sinh đơn hàng. Hệ thống đã tự động chuyển trạng thái sang 'Ngừng kinh doanh'!");
            }

            book.UpdatedBy = currentUserId.ToString();
            _bookRepository.Remove(book);
            await SaveWithAuditAsync(book, "Delete", oldValues, currentUserId);
            return true;
        }

        private static string Snapshot(Book book) => JsonSerializer.Serialize(new
        {
            book.Id, book.Isbn, book.Title, book.Author, book.PublisherId, book.CoverImg,
            book.IsPhysicalAvailable, book.PhysicalPrice, book.IsEBookAvailable, book.EBookPrice,
            book.IsRentalAvailable, book.WeeklyRentalPrice, book.MonthlyRentalPrice, book.YearlyRentalPrice,
            Status = book.Status.ToString(), book.StockCount, book.Pages, book.Weight,
            book.PublicationYear, book.Description, book.Language, book.Dimensions,
            CategoryIds = book.BookCategories.Select(category => category.CategoryId).OrderBy(id => id).ToList(),
            GalleryImages = book.BookImages.OrderBy(image => image.DisplayOrder).ThenBy(image => image.Id).Select(image => image.ImageUrl).ToList()
        });

        private async Task SaveWithAuditAsync(Book book, string action, string? oldValues, int userId, string? newValues = null)
        {
            // Giao dịch bao gồm cả lần lưu nghiệp vụ và lần lưu của dịch vụ audit chung.
            await using var transaction = _workflow.Database.CurrentTransaction == null ? await _workflow.Database.BeginTransactionAsync() : null;
            await _bookRepository.SaveChangesAsync();
            await _auditLogs.LogAsync(action, "BookManagement", "Book", book.Id.ToString(), oldValues,
                action == "Delete" ? null : newValues ?? Snapshot(book), userId: userId,
                ipAddress: _http?.HttpContext?.Connection.RemoteIpAddress?.ToString());
            if (transaction != null) await transaction.CommitAsync();
        }

        private async Task ValidateAsync(SaveBookDto dto)
        {
            ValidateBook(dto);
            if (!await _publishers.GetQuery().AnyAsync(p => p.Id == dto.PublisherId))
                throw new ArgumentException("Nhà xuất bản không tồn tại.");
            if (await _categories.GetQuery().CountAsync(c => dto.CategoryIds.Contains(c.Id)) != dto.CategoryIds.Count)
                throw new ArgumentException("Thể loại không tồn tại.");
        }

        private static void ValidateBook(SaveBookDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Author) || string.IsNullOrWhiteSpace(dto.Isbn))
                throw new ArgumentException("Tên sách, tác giả và ISBN không được để trống.");
            if (dto.Title.Trim().Length > 255 || dto.Author.Trim().Length > 255 || dto.Isbn.Trim().Length > 20)
                throw new ArgumentException("Tên sách/tác giả tối đa 255 ký tự và ISBN tối đa 20 ký tự.");
            if ((dto.CoverImg?.Length ?? 0) > 500 || dto.GalleryImages?.Any(url => string.IsNullOrWhiteSpace(url) || url.Length > 500) == true)
                throw new ArgumentException("Đường dẫn ảnh không được để trống hoặc dài quá 500 ký tự.");
            if (!Enum.TryParse<BookStatus>(dto.Status, true, out var status) || !Enum.IsDefined(status))
                throw new ArgumentException("Trạng thái kinh doanh không hợp lệ.");
            if (dto.PhysicalPrice < 0 || dto.EBookPrice < 0 || dto.WeeklyRentalPrice < 0 || dto.MonthlyRentalPrice < 0 || dto.YearlyRentalPrice < 0)
                throw new ArgumentException("Giá bán và giá thuê không được âm.");
            if (!dto.IsPhysicalAvailable && !dto.IsEBookAvailable && !dto.IsRentalAvailable)
                throw new ArgumentException("Sách phải có ít nhất một hình thức phát hành.");
            if (dto.IsPhysicalAvailable && dto.PhysicalPrice <= 0 || dto.IsEBookAvailable && dto.EBookPrice <= 0)
                throw new ArgumentException("Giá của phiên bản đang bán phải lớn hơn 0.");
            if (dto.IsRentalAvailable && (!dto.IsEBookAvailable || dto.WeeklyRentalPrice <= 0 && dto.MonthlyRentalPrice <= 0 && dto.YearlyRentalPrice <= 0))
                throw new ArgumentException("Thuê đọc cần phiên bản E-book và ít nhất một giá thuê hợp lệ.");
            if (dto.Pages is <= 0 || dto.Weight is <= 0 || dto.PublicationYear is < 1 || dto.PublicationYear > DateTime.UtcNow.Year + 1)
                throw new ArgumentException("Số trang, trọng lượng hoặc năm xuất bản không hợp lệ.");
            if (dto.PublisherId is null || dto.CategoryIds == null || dto.CategoryIds.Count == 0 || dto.CategoryIds.Any(id => id <= 0))
                throw new ArgumentException("Vui lòng chọn nhà xuất bản và ít nhất một thể loại.");
            dto.CategoryIds = dto.CategoryIds.Distinct().ToList();
        }

    }
}
