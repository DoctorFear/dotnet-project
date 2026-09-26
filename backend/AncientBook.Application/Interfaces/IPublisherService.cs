using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    // Interface xử lý nghiệp vụ Nhà xuất bản
    public interface IPublisherService
    {
        Task<List<PublisherDto>> GetAllPublishersAsync();
        Task<PagedResult<PublisherDto>> GetPagedPublishersAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<PublisherDto?> GetPublisherByIdAsync(int id);
        Task<PublisherDto> CreatePublisherAsync(SavePublisherDto dto, int currentUserId);
        Task<PublisherDto?> UpdatePublisherAsync(int id, SavePublisherDto dto, int currentUserId);
        Task<bool> DeletePublisherAsync(int id, int currentUserId);
    }
}