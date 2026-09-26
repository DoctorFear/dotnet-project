using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    // DTO hiển thị danh sách sách Storefront & Admin
    public class BookListDto
    {
        public int Id { get; set; }
        public string Isbn { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int? PublisherId { get; set; }
        public string? Publisher { get; set; }
        public List<int> CategoryIds { get; set; } = new List<int>();
        public List<string> Categories { get; set; } = new List<string>();
        public string CoverImg { get; set; } = string.Empty;
        public bool IsPhysicalAvailable { get; set; }
        public decimal PhysicalPrice { get; set; }
        public bool IsEBookAvailable { get; set; }
        public decimal EBookPrice { get; set; }
        public bool IsRentalAvailable { get; set; }
        public decimal WeeklyRentalPrice { get; set; }
        public decimal MonthlyRentalPrice { get; set; }
        public decimal YearlyRentalPrice { get; set; }
        public double Rating { get; set; }
        public int ReviewsCount { get; set; }
        public string StockStatus { get; set; } = "in_stock";
        public int StockCount { get; set; }
        public string Status { get; set; } = "selling";
    }

    // DTO xem chi tiết sách đầy đủ kèm gallery ảnh
    public class BookDetailDto : BookListDto
    {
        public int? Pages { get; set; }
        public int? Weight { get; set; }
        public int? PublicationYear { get; set; }
        public string? Description { get; set; }
        public string? EBookFilePath { get; set; }
        public List<string> GalleryImages { get; set; } = new List<string>();
    }

    // DTO tiếp nhận dữ liệu Thêm/Sửa sách ở Admin 
    public class SaveBookDto
    {
        public string Isbn { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int? PublisherId { get; set; }
        public List<int> CategoryIds { get; set; } = new List<int>();
        public string CoverImg { get; set; } = string.Empty;
        public bool IsPhysicalAvailable { get; set; } = true;
        public decimal PhysicalPrice { get; set; }
        public bool IsEBookAvailable { get; set; } = false;
        public decimal EBookPrice { get; set; }
        public bool IsRentalAvailable { get; set; } = false;
        public decimal WeeklyRentalPrice { get; set; }
        public decimal MonthlyRentalPrice { get; set; }
        public decimal YearlyRentalPrice { get; set; }
        public string Status { get; set; } = "selling";
        public int? Pages { get; set; }
        public int? Weight { get; set; }
        public int? PublicationYear { get; set; }
        public string? Description { get; set; }
        public string? EBookFilePath { get; set; }
        public List<string>? GalleryImages { get; set; }
    }
}