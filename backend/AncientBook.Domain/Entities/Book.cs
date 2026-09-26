using System.Collections.Generic;
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    public class Book : BaseEntity
    {
        public string Isbn { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int? PublisherId { get; set; }
        public string? Publisher { get; set; }
        public string CoverImg { get; set; } = string.Empty;

        // Có phát hành bản vật lý không
        public bool IsPhysicalAvailable { get; set; } = true;
        public decimal PhysicalPrice { get; set; }

        // Có phát hành bản E-Book đọc online không
        public bool IsEBookAvailable { get; set; } = false;
        public decimal EBookPrice { get; set; }

        // Có cho phép Thuê sách Online không
        public bool IsRentalAvailable { get; set; } = false;
        public decimal WeeklyRentalPrice { get; set; }
        public decimal MonthlyRentalPrice { get; set; }
        public decimal YearlyRentalPrice { get; set; }

        public double Rating { get; set; } = 0;
        public int ReviewsCount { get; set; } = 0;
        public StockStatus StockStatus { get; set; } = StockStatus.InStock;
        public int StockCount { get; set; } = 0;
        public BookStatus Status { get; set; } = BookStatus.Selling;
        public int? Pages { get; set; }
        public int? Weight { get; set; }
        public int? PublicationYear { get; set; }
        public string? Description { get; set; }
        public string? EBookFilePath { get; set; }

        // --- Navigation properties (Quan hệ bảng) ---

        public Publisher? PublisherEntity { get; set; }
        public Inventory? Inventory { get; set; }

        public ICollection<BookImage> BookImages { get; set; } = new List<BookImage>();
        public ICollection<BookCategory> BookCategories { get; set; } = new List<BookCategory>();
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}