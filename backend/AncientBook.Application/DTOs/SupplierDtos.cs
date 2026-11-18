using System;

namespace AncientBook.Application.DTOs
{
    public class SupplierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active, Inactive
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSupplierDto
    {
        public string Name { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
    }

    public class UpdateSupplierDto
    {
        public string Name { get; set; } = string.Empty;
        public string TaxCode { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
    }

    public class UpdateSupplierStatusDto
    {
        public string Status { get; set; } = "Inactive"; // Active | Inactive
    }
}
