using AncientBook.Application.Common.Interfaces;
using Dropbox.Api;
using Dropbox.Api.Files;
using Dropbox.Api.Sharing;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AncientBook.Infrastructure.Storage;

public class DropboxStorageService // : IFileStorageService
{
    private readonly IConfiguration _configuration;
    private readonly string _appKey;
    private readonly string _appSecret;
    private readonly string _refreshToken;
    private readonly string _baseFolder;

    public DropboxStorageService(IConfiguration configuration)
    {
        _configuration = configuration;
        _appKey = _configuration["Dropbox:AppKey"] ?? string.Empty;
        _appSecret = _configuration["Dropbox:AppSecret"] ?? string.Empty;
        _refreshToken = _configuration["Dropbox:RefreshToken"] ?? string.Empty;
        _baseFolder = _configuration["Dropbox:FolderPath"] ?? "/AncientBookChat";
    }

    private DropboxClient GetClient()
    {
        if (string.IsNullOrWhiteSpace(_refreshToken) ||
            string.IsNullOrWhiteSpace(_appKey) ||
            string.IsNullOrWhiteSpace(_appSecret))
        {
            throw new InvalidOperationException("Cấu hình Dropbox (AppKey, AppSecret, RefreshToken) chưa được thiết lập trong hệ thống.");
        }

        // Tự động quản lý vòng đời Access Token bằng RefreshToken
        return new DropboxClient(_refreshToken, _appKey, _appSecret);
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folder)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Tệp tải lên không hợp lệ hoặc để trống.");
        }

        // BR04 & E3 UC23: Ràng buộc dung lượng tối đa 5MB (5 * 1024 * 1024 bytes)
        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            throw new InvalidOperationException("Kích thước tệp vượt quá giới hạn cho phép (tối đa 5MB).");
        }

        // BR04 & E3 UC23: Ràng buộc định dạng ảnh phổ biến
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Định dạng tệp không hợp lệ. Chỉ chấp nhận các định dạng ảnh: .png, .jpg, .jpeg, .webp.");
        }

        // Đặt tên file ngẫu nhiên để chống ghi đè và tăng tính bảo mật
        string uniqueFileName = $"{Guid.NewGuid():N}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";

        // Chuẩn hóa đường dẫn thư mục Dropbox (luôn bắt đầu bằng dấu /, không có dấu / thừa)
        string subFolder = string.IsNullOrWhiteSpace(folder) ? "Attachments" : folder.Trim('/');
        string targetPath = $"{_baseFolder}/{subFolder}/{uniqueFileName}".Replace("//", "/");

        using var client = GetClient();
        await using var stream = file.OpenReadStream();

        // 1. Tải tệp lên Dropbox
        await client.Files.UploadAsync(
            targetPath,
            WriteMode.Overwrite.Instance,
            body: stream);

        // 2. Lấy Direct Link công khai để client xem được trực tiếp
        return await GetDirectSharedLinkAsync(client, targetPath);
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        // Có thể mở rộng để phân tích đường dẫn từ fileUrl và xóa nếu cần giải phóng bộ nhớ
        await Task.CompletedTask;
    }

    private static async Task<string> GetDirectSharedLinkAsync(DropboxClient client, string path)
    {
        try
        {
            // Thử tạo Shared Link công khai mới cho file
            var settings = new SharedLinkSettings(requestedVisibility: RequestedVisibility.Public.Instance);
            var sharedLinkMetadata = await client.Sharing.CreateSharedLinkWithSettingsAsync(path, settings);

            return ConvertToDirectLink(sharedLinkMetadata.Url);
        }
        catch (DropboxException)
        {
            // Nếu Shared Link cho file này đã tồn tại từ trước, truy vấn lại danh sách link hiện có
            var sharedLinks = await client.Sharing.ListSharedLinksAsync(path);
            var existingLink = sharedLinks.Links.FirstOrDefault();

            if (existingLink != null)
            {
                return ConvertToDirectLink(existingLink.Url);
            }

            throw new InvalidOperationException("Không thể khởi tạo đường dẫn xem ảnh từ Dropbox.");
        }
    }

    /// <summary>
    /// Chuyển đổi URL xem trước của Dropbox (dạng ?dl=0) sang Direct Link (dạng ?raw=1)
    /// để trình duyệt web có thể render trực tiếp trong thẻ <img src="..." />
    /// </summary>
    private static string ConvertToDirectLink(string dropboxUrl)
    {
        if (string.IsNullOrEmpty(dropboxUrl)) return string.Empty;

        if (dropboxUrl.Contains("?dl=0"))
        {
            return dropboxUrl.Replace("?dl=0", "?raw=1");
        }

        if (dropboxUrl.Contains("?dl=1"))
        {
            return dropboxUrl.Replace("?dl=1", "?raw=1");
        }

        return $"{dropboxUrl}?raw=1";
    }
}