using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        // Lấy tất cả danh mục thể loại
        public async Task<List<CategoryDto>> GetAllCategoriesAsync()
        {
            return await _categoryRepository.GetQuery()
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ParentId = c.ParentId,
                    BookCount = c.BookCategories.Count
                })
                .ToListAsync();
        }

        // Lấy danh sách thể loại có phân trang và tìm kiếm 
        public async Task<PagedResult<CategoryDto>> GetPagedCategoriesAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var query = _categoryRepository.GetQuery();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term) || (c.Description != null && c.Description.ToLower().Contains(term)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ParentId = c.ParentId,
                    BookCount = c.BookCategories.Count
                })
                .ToListAsync();

            return new PagedResult<CategoryDto>(items, totalCount, pageNumber, pageSize);
        }

        // Lấy chi tiết thể loại theo Id
        public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdWithBooksAsync(id);

            if (category == null) return null;

            return new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ParentId = category.ParentId,
                BookCount = category.BookCategories.Count
            };
        }

        // Thêm thể loại mới
        public async Task<CategoryDto> CreateCategoryAsync(SaveCategoryDto dto, int currentUserId)
        {
            if (await _categoryRepository.IsNameExistsAsync(dto.Name.Trim()))
                throw new Exception("Tên danh mục thể loại này đã tồn tại!");

            var category = new Category
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                ParentId = dto.ParentId,
                CreatedBy = currentUserId.ToString()
            };

            _categoryRepository.Add(category);
            await _categoryRepository.SaveChangesAsync();

            return new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description, ParentId = category.ParentId };
        }

        // Cập nhật thông tin thể loại 
        public async Task<CategoryDto?> UpdateCategoryAsync(int id, SaveCategoryDto dto, int currentUserId)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null) return null;

            if (await _categoryRepository.IsNameExistsAsync(dto.Name.Trim(), id))
                throw new Exception("Tên danh mục thể loại đã tồn tại!");

            category.Name = dto.Name.Trim();
            category.Description = dto.Description;
            category.ParentId = dto.ParentId;
            category.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            category.UpdatedBy = currentUserId.ToString();

            await _categoryRepository.SaveChangesAsync();

            return new CategoryDto { Id = category.Id, Name = category.Name, Description = category.Description, ParentId = category.ParentId };
        }

        // Xóa thể loại - Kiểm tra ràng buộc sách liên kết 
        public async Task<bool> DeleteCategoryAsync(int id, int currentUserId)
        {
            var category = await _categoryRepository.GetByIdWithBooksAsync(id);
            if (category == null) return false;

            if (category.BookCategories.Any())
                throw new Exception($"Không thể xóa danh mục này vì đang có {category.BookCategories.Count} sách thuộc danh mục!");

            if (await _categoryRepository.HasChildrenAsync(id))
                throw new Exception("Không thể xóa danh mục này vì đang có danh mục con!");

            _categoryRepository.Remove(category);
            await _categoryRepository.SaveChangesAsync();
            return true;
        }
    }
}
