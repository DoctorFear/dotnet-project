using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace AncientBook.Application.DTOs
{
    public class RefundRequestDto
    {
        public int OrderId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string ShippingMethod { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        
        public List<IFormFile>? Images { get; set; }
        public IFormFile? Video { get; set; }
    }

    public class RefundResponseDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string ShippingMethod { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        
        public List<string> ImageUrls { get; set; } = new List<string>();
        public string? VideoUrl { get; set; }
        
        public DateTime CreatedAt { get; set; }
    }

    public class GetRefundsQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? UserId { get; set; }
        public string? SearchKeyword { get; set; }
    }
}