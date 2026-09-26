using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    // DTO tiêu chí lọc và tìm kiếm sách nâng cao ở Storefront và Admin
    public class BookFilterRequestDto
    {
        public string? SearchTerm { get; set; }
        public List<int>? CategoryIds { get; set; }
        public List<int>? PublisherIds { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? PublicationYear { get; set; }
        public double? MinRating { get; set; }
        public string? Status { get; set; }
        public string? SortBy { get; set; } = "newest";
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 12;
    }
}