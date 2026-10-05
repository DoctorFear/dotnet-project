using System;
using System.Collections.Generic;
using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class Supplier : BaseEntity, IAuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty; 
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; 

        // Navigation property
        public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    }
}