// AncientBook.Application/DTOs/Auth/RegisterResponseDto.cs
using System;

namespace AncientBook.Application.DTOs.Auth
{
    public class RegisterResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
        public int FPoints { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}