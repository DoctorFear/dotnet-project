namespace AncientBook.Application.Interfaces
{
    public interface IHmacSha256Hasher
    {
        string ComputeHmacSha256(string message, string secretKey);
    }
}