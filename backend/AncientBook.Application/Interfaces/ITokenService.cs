using AncientBook.Domain.Entities;

namespace AncientBook.Application.Common.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user);
    }
}