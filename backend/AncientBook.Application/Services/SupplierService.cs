using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.DTOs;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Services
{
    public interface ISupplierService
    {
        Task<List<SupplierDto>> GetAllSuppliersAsync(string? searchKeyword = null, string? status = null);
        Task<SupplierDto?> GetSupplierByIdAsync(int id);
        Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto, string? createdBy = null);
        Task<bool> UpdateSupplierAsync(int id, UpdateSupplierDto dto, string? updatedBy = null);
        Task<bool> UpdateSupplierStatusAsync(int id, string status, string? updatedBy = null);
    }

    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _supplierRepository;

        public SupplierService(ISupplierRepository supplierRepository)
        {
            _supplierRepository = supplierRepository;
        }

        public async Task<List<SupplierDto>> GetAllSuppliersAsync(string? searchKeyword = null, string? status = null)
        {
            var suppliers = await _supplierRepository.GetAllAsync(searchKeyword, status);
            return suppliers.Select(MapToDto).ToList();
        }

        public async Task<SupplierDto?> GetSupplierByIdAsync(int id)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            return supplier == null ? null : MapToDto(supplier);
        }

        public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto, string? createdBy = null)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new InvalidOperationException("Tên nhà cung cấp không được để trống.");
            }

            if (!string.IsNullOrWhiteSpace(dto.TaxCode))
            {
                var existing = await _supplierRepository.GetByTaxCodeAsync(dto.TaxCode);
                if (existing != null)
                {
                    throw new InvalidOperationException($"Mã số thuế '{dto.TaxCode}' đã tồn tại trên hệ thống.");
                }
            }

            var supplier = new Supplier
            {
                Name = dto.Name.Trim(),
                TaxCode = dto.TaxCode.Trim(),
                Address = dto.Address.Trim(),
                Phone = dto.Phone.Trim(),
                Email = dto.Email.Trim(),
                ContactPerson = dto.ContactPerson.Trim(),
                Status = "Active",
                CreatedBy = createdBy
            };

            await _supplierRepository.AddAsync(supplier);
            await _supplierRepository.SaveChangesAsync();

            return MapToDto(supplier);
        }

        public async Task<bool> UpdateSupplierAsync(int id, UpdateSupplierDto dto, string? updatedBy = null)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null) return false;

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new InvalidOperationException("Tên nhà cung cấp không được để trống.");
            }

            if (!string.IsNullOrWhiteSpace(dto.TaxCode) &&
                !string.Equals(supplier.TaxCode, dto.TaxCode.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var existing = await _supplierRepository.GetByTaxCodeAsync(dto.TaxCode);
                if (existing != null && existing.Id != id)
                {
                    throw new InvalidOperationException($"Mã số thuế '{dto.TaxCode}' đã được sử dụng bởi nhà cung cấp khác.");
                }
            }

            supplier.Name = dto.Name.Trim();
            supplier.TaxCode = dto.TaxCode.Trim();
            supplier.Address = dto.Address.Trim();
            supplier.Phone = dto.Phone.Trim();
            supplier.Email = dto.Email.Trim();
            supplier.ContactPerson = dto.ContactPerson.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                supplier.Status = dto.Status.Trim();
            }
            supplier.UpdatedBy = updatedBy;

            _supplierRepository.Update(supplier);
            await _supplierRepository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateSupplierStatusAsync(int id, string status, string? updatedBy = null)
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null) return false;

            if (string.IsNullOrWhiteSpace(status))
            {
                throw new InvalidOperationException("Trạng thái hợp tác không hợp lệ.");
            }

            supplier.Status = status.Trim();
            supplier.UpdatedBy = updatedBy;

            _supplierRepository.Update(supplier);
            await _supplierRepository.SaveChangesAsync();
            return true;
        }

        private static SupplierDto MapToDto(Supplier s)
        {
            return new SupplierDto
            {
                Id = s.Id,
                Name = s.Name,
                TaxCode = s.TaxCode,
                Address = s.Address,
                Phone = s.Phone,
                Email = s.Email,
                ContactPerson = s.ContactPerson,
                Status = s.Status,
                CreatedAt = s.CreatedAt
            };
        }
    }
}
