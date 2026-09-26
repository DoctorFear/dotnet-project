using System;
using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    // Thực thể Tài khoản người dùng (Kế thừa BaseEntity)
    public class User : BaseEntity
    {
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
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
    }
}