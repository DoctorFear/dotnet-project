using Microsoft.AspNetCore.Http;

namespace AncientBook.Application.Interfaces;

public interface IBookImageService
{
    Task<string> UploadAsync(IFormFile file);
}
