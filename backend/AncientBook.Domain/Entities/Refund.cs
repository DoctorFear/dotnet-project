using AncientBook.Domain.Common;
using System.Collections.Generic;

namespace AncientBook.Domain.Entities
{
    public class Refund : BaseEntity
    {
        public int OrderId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string ShippingMethod { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        
        public List<string> ImageUrls { get; set; } = new List<string>();
        public string? VideoUrl { get; set; }

        public Order? Order { get; set; }
    }
}