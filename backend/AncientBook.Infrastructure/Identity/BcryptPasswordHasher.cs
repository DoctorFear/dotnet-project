// AncientBook.Infrastructure/Identity/BcryptPasswordHasher.cs
using AncientBook.Application.Interfaces;
using BCrypt.Net;
using Microsoft.AspNetCore.Identity;

namespace AncientBook.Infrastructure.Identity
{
    public class BcryptPasswordHasher : IPasswordHasher
    {
        public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);

        public bool VerifyPassword(string password, string passwordHash) =>
            BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}