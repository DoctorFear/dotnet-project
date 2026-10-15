using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AncientBook.Application.Services;

public class BookImageService(IFileStorageService storage) : IBookImageService
{
    public async Task<string> UploadAsync(IFormFile file)
    {
        if (file == null || file.Length == 0 || file.Length > 10 * 1024 * 1024)
            throw new ArgumentException("Ảnh phải có dung lượng từ 1 byte đến 10 MB.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".jpg" or ".jpeg" or ".png"))
            throw new ArgumentException("Chỉ hỗ trợ ảnh JPG/PNG.");
        var header = new byte[8];
        await using var stream = file.OpenReadStream();
        var count = await stream.ReadAsync(header);
        var png = count == 8 && header.SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 });
        var jpeg = count >= 3 && header[0] == 255 && header[1] == 216 && header[2] == 255;
        if (extension == ".png" ? !png : !jpeg)
            throw new ArgumentException("Nội dung tệp không phải ảnh JPG/PNG hợp lệ.");
        return await storage.SaveFileAsync(file, "books");
    }
}
