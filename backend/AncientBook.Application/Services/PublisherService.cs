using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace AncientBook.Application.Services
{
    public class PublisherService : IPublisherService
    {
        private readonly IPublisherRepository _publisherRepository;
        private readonly IAuditLogService _auditLogs;
        private readonly IWorkflowDbContext _workflow;
        private readonly IHttpContextAccessor? _http;

        public PublisherService(IPublisherRepository publisherRepository, IAuditLogService auditLogs, IWorkflowDbContext workflow, IHttpContextAccessor? http = null)
        {
            _publisherRepository = publisherRepository;
            _auditLogs = auditLogs;
            _workflow = workflow;
            _http = http;
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
                    Description = p.Description,
                    BookCount = p.Books.Count
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
                query = query.Where(p => p.Name.ToLower().Contains(term) || (p.Phone != null && p.Phone.Contains(term)) || (p.Email != null && p.Email.ToLower().Contains(term)));
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
                    Description = p.Description,
                    BookCount = p.Books.Count
                })
                .ToListAsync();

            return new PagedResult<PublisherDto>(items, totalCount, pageNumber, pageSize);
        }

        // Lấy thông tin NXB theo Id
        public async Task<PublisherDto?> GetPublisherByIdAsync(int id)
        {
            var p = await _publisherRepository.GetByIdAsync(id);
            if (p == null) return null;

            return await _publisherRepository.GetQuery().Where(x => x.Id == id).Select(x => new PublisherDto { Id = x.Id, Name = x.Name, Address = x.Address, Phone = x.Phone, Email = x.Email, Description = x.Description, BookCount = x.Books.Count }).SingleAsync();
        }

        // Thêm nhà xuất bản mới 
        public async Task<PublisherDto> CreatePublisherAsync(SavePublisherDto dto, int currentUserId)
        {
            Validate(dto);
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
            await SaveWithAuditAsync(publisher, "Create", null, currentUserId);

            return new PublisherDto { Id = publisher.Id, Name = publisher.Name, Address = publisher.Address, Phone = publisher.Phone, Email = publisher.Email, Description = publisher.Description };
        }

        // Cập nhật NXB
        public async Task<PublisherDto?> UpdatePublisherAsync(int id, SavePublisherDto dto, int currentUserId)
        {
            var publisher = await _publisherRepository.GetByIdAsync(id);
            if (publisher == null) return null;

            Validate(dto);
            if (await _publisherRepository.IsNameExistsAsync(dto.Name.Trim(), id))
                throw new Exception("Tên nhà xuất bản đã tồn tại!");

            var oldValues = Snapshot(publisher);
            publisher.Name = dto.Name.Trim();
            publisher.Address = dto.Address;
            publisher.Phone = dto.Phone;
            publisher.Email = dto.Email;
            publisher.Description = dto.Description;
            publisher.UpdatedAt = TimeZoneHelper.GetVietnamTime();
            publisher.UpdatedBy = currentUserId.ToString();

            await SaveWithAuditAsync(publisher, "Update", oldValues, currentUserId);

            return (await GetPublisherByIdAsync(id))!;
        }

        // Xóa NXB - Kiểm tra ràng buộc sách liên kết
        public async Task<bool> DeletePublisherAsync(int id, int currentUserId)
        {
            var publisher = await _publisherRepository.GetByIdAsync(id);
            if (publisher == null) return false;

            var hasBooks = await _publisherRepository.HasBooksAsync(id);
            if (hasBooks)
                throw new Exception("Không thể xóa NXB này vì đang có sách thuộc nhà xuất bản này!");

            publisher.UpdatedBy = currentUserId.ToString();
            var oldValues = Snapshot(publisher);
            _publisherRepository.Remove(publisher);
            await SaveWithAuditAsync(publisher, "Delete", oldValues, currentUserId);
            return true;
        }

        private static string Snapshot(Publisher publisher) => JsonSerializer.Serialize(new { publisher.Id, publisher.Name, publisher.Address, publisher.Phone, publisher.Email, publisher.Description });

        private async Task SaveWithAuditAsync(Publisher publisher, string action, string? oldValues, int userId)
        {
            await using var transaction = _workflow.Database.CurrentTransaction == null ? await _workflow.Database.BeginTransactionAsync() : null;
            await _publisherRepository.SaveChangesAsync();
            await _auditLogs.LogAsync(action, "BookManagement", "Publisher", publisher.Id.ToString(), oldValues,
                action == "Delete" ? null : Snapshot(publisher), userId: userId,
                ipAddress: _http?.HttpContext?.Connection.RemoteIpAddress?.ToString());
            if (transaction != null) await transaction.CommitAsync();
        }

        private static void Validate(SavePublisherDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Trim().Length > 200)
                throw new ArgumentException("Tên nhà xuất bản phải có từ 1 đến 200 ký tự.");
            if (!string.IsNullOrWhiteSpace(dto.Email) && !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(dto.Email))
                throw new ArgumentException("Email nhà xuất bản không hợp lệ.");
            if (!string.IsNullOrWhiteSpace(dto.Phone) && (dto.Phone.Length > 20 || dto.Phone.Any(c => !char.IsDigit(c) && c != '+' && c != '-' && c != ' ' && c != '(' && c != ')')))
                throw new ArgumentException("Số điện thoại nhà xuất bản không hợp lệ.");
        }
    }
}
