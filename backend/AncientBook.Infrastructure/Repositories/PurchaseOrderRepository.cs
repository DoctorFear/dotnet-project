using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class PurchaseOrderRepository : IPurchaseOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public PurchaseOrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<PurchaseOrder>> GetAllAsync(string? status = null, int? supplierId = null, string? searchKeyword = null)
        {
            var query = _context.PurchaseOrders
                .AsNoTracking()
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.Book)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToLower();
                query = query.Where(po => po.Status.ToLower() == normalizedStatus);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(po => po.SupplierId == supplierId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchKeyword))
            {
                var keyword = searchKeyword.Trim().ToLower();
                query = query.Where(po =>
                    po.Code.ToLower().Contains(keyword) ||
                    po.Supplier.Name.ToLower().Contains(keyword) ||
                    po.Notes.ToLower().Contains(keyword));
            }

            return await query
                .OrderByDescending(po => po.CreatedAt)
                .ToListAsync();
        }

        public async Task<PurchaseOrder?> GetByIdAsync(int id)
        {
            return await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.Book)
                .FirstOrDefaultAsync(po => po.Id == id);
        }

        public async Task<PurchaseOrder?> GetByCodeAsync(string code)
        {
            var normalized = code.Trim().ToUpper();
            return await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.Book)
                .FirstOrDefaultAsync(po => po.Code.ToUpper() == normalized);
        }

        public async Task<int> GetCountByYearAsync(int year)
        {
            string prefix = $"PO-{year}-";
            return await _context.PurchaseOrders
                .CountAsync(po => po.Code.StartsWith(prefix));
        }

        public async Task AddAsync(PurchaseOrder purchaseOrder)
        {
            await _context.PurchaseOrders.AddAsync(purchaseOrder);
        }

        public void Update(PurchaseOrder purchaseOrder)
        {
            _context.PurchaseOrders.Update(purchaseOrder);
        }

        public async Task ExecuteInTransactionAsync(Func<Task> operation)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await operation();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
