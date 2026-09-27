using AncientBook.Application.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace AncientBook.Infrastructure.Identity
{
    public class HmacSha256Hasher : IHmacSha256Hasher
    {
        public string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(messageBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}