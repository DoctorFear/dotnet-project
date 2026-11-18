using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IShipperRepository
    {
        Task<List<Shipper>> GetAllAsync();
        Task<List<Shipper>> GetByFilterAsync(string? status, string? area);
        Task<Shipper?> GetByIdAsync(int id);
        Task AddAsync(Shipper shipper);
        void Update(Shipper shipper);
        Task SaveChangesAsync();
    }
}
