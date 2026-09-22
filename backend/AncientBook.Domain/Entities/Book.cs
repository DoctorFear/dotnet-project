using System;
using System.Collections.Generic;

namespace AncientBook.Domain.Entities
{
    public class Book
    {
        public int Id { get; set; }
        public string Isbn { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int? PublisherId { get; set; }
        public decimal Price { get; set; }
        public int? PublicationYear { get; set; }
        public int? Pages { get; set; }
        public string? CoverUrl { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Inventory? Inventory { get; set; }
        
        public ICollection<BookCategory> BookCategories { get; set; } = new List<BookCategory>();
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}