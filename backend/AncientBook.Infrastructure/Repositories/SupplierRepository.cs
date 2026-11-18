using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly ApplicationDbContext _context;

        public SupplierRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Supplier>> GetAllAsync(string? searchKeyword = null, string? status = null)
        {
            var query = _context.Suppliers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToLower();
                query = query.Where(s => s.Status.ToLower() == normalizedStatus);
            }

            if (!string.IsNullOrWhiteSpace(searchKeyword))
            {
                var keyword = searchKeyword.Trim().ToLower();
                query = query.Where(s =>
                    s.Name.ToLower().Contains(keyword) ||
                    s.TaxCode.ToLower().Contains(keyword) ||
                    s.Phone.ToLower().Contains(keyword) ||
                    s.ContactPerson.ToLower().Contains(keyword));
            }

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            return await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Supplier?> GetByTaxCodeAsync(string taxCode)
        {
            var normalized = taxCode.Trim().ToLower();
            return await _context.Suppliers
                .FirstOrDefaultAsync(s => s.TaxCode.ToLower() == normalized);
        }

        public async Task AddAsync(Supplier supplier)
        {
            await _context.Suppliers.AddAsync(supplier);
        }

        public void Update(Supplier supplier)
        {
            _context.Suppliers.Update(supplier);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
