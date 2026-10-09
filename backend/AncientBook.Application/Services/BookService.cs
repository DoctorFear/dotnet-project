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

namespace AncientBook.Application.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _bookRepository;

        public BookService(IBookRepository bookRepository)
        {
            _bookRepository = bookRepository;
        }

        // Tra cứu, lọc nâng cao và phân trang danh sách sách
        public async Task<PagedResult<BookListDto>> GetFilteredBooksAsync(BookFilterRequestDto filter)
        {
            if (filter.PageNumber < 1) filter.PageNumber = 1;
            if (filter.PageSize < 1) filter.PageSize = 12;
            if (filter.PageSize > 100) filter.PageSize = 100;

            var query = _bookRepository.GetBookListQuery();

            // Lọc theo từ khóa (Tên sách, Tác giả, ISBN)
            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var term = filter.SearchTerm.Trim().ToLower();
                query = query.Where(b => b.Title.ToLower().Contains(term) ||
                                         b.Author.ToLower().Contains(term) ||
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
                "price_asc" => query.OrderBy(b => b.PhysicalPrice),
                "price_desc" => query.OrderByDescending(b => b.PhysicalPrice),
                "rating" => query.OrderByDescending(b => b.Rating),
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
                    StockStatus = GetStockStatusValue(b.StockStatus),
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
                StockStatus = GetStockStatusValue(b.StockStatus),
                StockCount = b.StockCount,
                Status = b.Status.ToString().ToLower(),
                Pages = b.Pages,
                Weight = b.Weight,
                PublicationYear = b.PublicationYear,
                Description = b.Description,
                GalleryImages = b.BookImages.Select(bi => bi.ImageUrl).ToList()
            };
        }

        // Thêm đầu sách mới - Tồn kho mặc định = 0 
        public async Task<BookDetailDto> CreateBookAsync(SaveBookDto dto, int currentUserId)
        {
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
                foreach (var imgUrl in dto.GalleryImages)
                {
                    book.BookImages.Add(new BookImage { ImageUrl = imgUrl });
                }
            }

            _bookRepository.Add(book);
            await _bookRepository.SaveChangesAsync();

            return (await GetBookDetailByIdAsync(book.Id))!;
        }

        // Cập nhật thông tin sách - Khóa sửa ISBN và StockCount
        public async Task<BookDetailDto?> UpdateBookAsync(int id, SaveBookDto dto, int currentUserId)
        {
            var book = await _bookRepository.GetForUpdateAsync(id);

            if (book == null) return null;

            if (!Enum.TryParse<BookStatus>(dto.Status, true, out var statusEnum))
                throw new Exception("Trạng thái kinh doanh không hợp lệ!");

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
            book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            book.UpdatedBy = currentUserId.ToString();

            // Cập nhật bảng trung gian danh mục N-N
            _bookRepository.RemoveBookCategories(book.BookCategories);
            if (dto.CategoryIds != null)
            {
                foreach (var catId in dto.CategoryIds)
                {
                    book.BookCategories.Add(new BookCategory { BookId = id, CategoryId = catId });
                }
            }

            // Cập nhật Gallery ảnh
            _bookRepository.RemoveBookImages(book.BookImages);
            if (dto.GalleryImages != null)
            {
                foreach (var imgUrl in dto.GalleryImages)
                {
                    book.BookImages.Add(new BookImage { BookId = id, ImageUrl = imgUrl });
                }
            }

            await _bookRepository.SaveChangesAsync();
            return await GetBookDetailByIdAsync(id);
        }

        // Chuyển nhanh trạng thái kinh doanh sách 
        public async Task<bool> UpdateBookStatusAsync(int id, string status, int currentUserId)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return false;

            if (Enum.TryParse<BookStatus>(status, true, out var statusEnum))
            {
                book.Status = statusEnum;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                book.UpdatedBy = currentUserId.ToString();
                await _bookRepository.SaveChangesAsync();
                return true;
            }
            return false;
        }

        // Xóa sách - Nếu đã có đơn hàng thì chuyển sang 'Stopped'
        public async Task<bool> DeleteBookAsync(int id, int currentUserId)
        {
            var book = await _bookRepository.GetForDeleteAsync(id);
            if (book == null) return false;

            if (book.OrderItems.Any())
            {
                book.Status = BookStatus.Stopped;
                book.UpdatedAt = TimeZoneHelper.GetVietnamTime();
                book.UpdatedBy = currentUserId.ToString();
                await _bookRepository.SaveChangesAsync();
                throw new Exception("Không thể xóa sách này vì đã phát sinh đơn hàng. Hệ thống đã tự động chuyển trạng thái sang 'Ngừng kinh doanh'!");
            }

            _bookRepository.Remove(book);
            await _bookRepository.SaveChangesAsync();
            return true;
        }

        private static string GetStockStatusValue(StockStatus stockStatus) => stockStatus switch
        {
            StockStatus.InStock => "in_stock",
            StockStatus.LowStock => "low_stock",
            StockStatus.OutOfStock => "out_of_stock",
            _ => "out_of_stock"
        };
    }
}
