using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    // Interface xử lý nghiệp vụ Danh mục thể loại
    public interface ICategoryService
    {
        Task<List<CategoryDto>> GetAllCategoriesAsync();
        Task<PagedResult<CategoryDto>> GetPagedCategoriesAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<CategoryDto?> GetCategoryByIdAsync(int id);
        Task<CategoryDto> CreateCategoryAsync(SaveCategoryDto dto, int currentUserId);
        Task<CategoryDto?> UpdateCategoryAsync(int id, SaveCategoryDto dto, int currentUserId);
        Task<bool> DeleteCategoryAsync(int id, int currentUserId);
    }
}