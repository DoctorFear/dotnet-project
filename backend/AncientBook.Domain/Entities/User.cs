using System;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    public class User 
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public int FPoints { get; set; } = 0;
        public UserRole Role { get; set; } = UserRole.Member; // BR03

        // Audit Trail
        public DateTime CreatedAt { get; set; } = TimeZoneHelper.GetVietnamTime();
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}