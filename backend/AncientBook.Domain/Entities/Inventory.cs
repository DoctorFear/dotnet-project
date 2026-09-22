using System;

namespace AncientBook.Domain.Entities
{
    public class Inventory
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public int QuantityOnHand { get; set; } = 0;
        public int ReorderLevel { get; set; } = 5;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Book? Book { get; set; }
    }
}