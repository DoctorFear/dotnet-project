using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface ISupplierRepository
    {
        Task<List<Supplier>> GetAllAsync(string? searchKeyword = null, string? status = null);
        Task<Supplier?> GetByIdAsync(int id);
        Task<Supplier?> GetByTaxCodeAsync(string taxCode);
        Task AddAsync(Supplier supplier);
        void Update(Supplier supplier);
        Task SaveChangesAsync();
    }
}
