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
    public class PublisherService : IPublisherService
    {
        private readonly IPublisherRepository _publisherRepository;

        public PublisherService(IPublisherRepository publisherRepository)
        {
            _publisherRepository = publisherRepository;
        }

        // Lấy tất cả nhà xuất bản
        public async Task<List<PublisherDto>> GetAllPublishersAsync()
        {
            return await _publisherRepository.GetQuery()
                .Select(p => new PublisherDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Address = p.Address,
                    Phone = p.Phone,
                    Email = p.Email,
                    Description = p.Description
                })
                .ToListAsync();
        }

        // Lấy danh sách NXB phân trang 
        public async Task<PagedResult<PublisherDto>> GetPagedPublishersAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var query = _publisherRepository.GetQuery();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(term) || (p.Email != null && p.Email.ToLower().Contains(term)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(p => p.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PublisherDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Address = p.Address,
                    Phone = p.Phone,
                    Email = p.Email,
                    Description = p.Description
                })
                .ToListAsync();

            return new PagedResult<PublisherDto>(items, totalCount, pageNumber, pageSize);
        }

        // Lấy thông tin NXB theo Id
        public async Task<PublisherDto?> GetPublisherByIdAsync(int id)
        {
            var p = await _publisherRepository.GetByIdAsync(id);
            if (p == null) return null;

            return new PublisherDto { Id = p.Id, Name = p.Name, Address = p.Address, Phone = p.Phone, Email = p.Email, Description = p.Description };
        }

        // Thêm nhà xuất bản mới 
        public async Task<PublisherDto> CreatePublisherAsync(SavePublisherDto dto, int currentUserId)
        {
            if (await _publisherRepository.IsNameExistsAsync(dto.Name.Trim()))
                throw new Exception("Tên nhà xuất bản này đã tồn tại!");

            var publisher = new Publisher
            {
                Name = dto.Name.Trim(),
                Address = dto.Address,
                Phone = dto.Phone,
                Email = dto.Email,
                Description = dto.Description,
                CreatedBy = currentUserId.ToString()
            };

            _publisherRepository.Add(publisher);
            await _publisherRepository.SaveChangesAsync();

            return new PublisherDto { Id = publisher.Id, Name = publisher.Name, Address = publisher.Address, Phone = publisher.Phone, Email = publisher.Email, Description = publisher.Description };
        }

        // Cập nhật NXB
        public async Task<PublisherDto?> UpdatePublisherAsync(int id, SavePublisherDto dto, int currentUserId)
        {
            var publisher = await _publisherRepository.GetByIdAsync(id);
            if (publisher == null) return null;

            if (await _publisherRepository.IsNameExistsAsync(dto.Name.Trim(), id))
                throw new Exception("Tên nhà xuất bản đã tồn tại!");

            publisher.Name = dto.Name.Trim();
            publisher.Address = dto.Address;
            publisher.Phone = dto.Phone;
            publisher.Email = dto.Email;
            publisher.Description = dto.Description;
            publisher.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            publisher.UpdatedBy = currentUserId.ToString();

            await _publisherRepository.SaveChangesAsync();

            return new PublisherDto { Id = publisher.Id, Name = publisher.Name, Address = publisher.Address, Phone = publisher.Phone, Email = publisher.Email, Description = publisher.Description };
        }

        // Xóa NXB - Kiểm tra ràng buộc sách liên kết
        public async Task<bool> DeletePublisherAsync(int id, int currentUserId)
        {
            var publisher = await _publisherRepository.GetByIdAsync(id);
            if (publisher == null) return false;

            var hasBooks = await _publisherRepository.HasBooksAsync(id);
            if (hasBooks)
                throw new Exception("Không thể xóa NXB này vì đang có sách thuộc nhà xuất bản này!");

            _publisherRepository.Remove(publisher);
            await _publisherRepository.SaveChangesAsync();
            return true;
        }
    }
}
