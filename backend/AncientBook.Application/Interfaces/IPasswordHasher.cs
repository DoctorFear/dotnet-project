// AncientBook.Application/Interfaces/IPasswordHasher.cs
namespace AncientBook.Application.Interfaces
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }
}