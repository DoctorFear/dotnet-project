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

        // reset password token and expiration
        public string? PasswordResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }

        // Audit Trail
        public DateTime CreatedAt { get; set; } = TimeZoneHelper.GetVietnamTime();
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }


        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
    }
}