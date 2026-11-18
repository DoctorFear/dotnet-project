using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IPurchaseOrderRepository
    {
        Task<List<PurchaseOrder>> GetAllAsync(string? status = null, int? supplierId = null, string? searchKeyword = null);
        Task<PurchaseOrder?> GetByIdAsync(int id);
        Task<PurchaseOrder?> GetByCodeAsync(string code);
        Task<int> GetCountByYearAsync(int year);
        Task AddAsync(PurchaseOrder purchaseOrder);
        void Update(PurchaseOrder purchaseOrder);
        Task ExecuteInTransactionAsync(Func<Task> operation);
        Task SaveChangesAsync();
    }
}
