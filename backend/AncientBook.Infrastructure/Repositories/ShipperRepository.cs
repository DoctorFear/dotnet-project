using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;

namespace AncientBook.Infrastructure.Persistence.Repositories
{
    public class ShipperRepository : IShipperRepository
    {
        private readonly ApplicationDbContext _context;

        public ShipperRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Shipper>> GetAllAsync()
        {
            return await _context.Shippers.AsNoTracking().ToListAsync();
        }

        public async Task<Shipper?> GetByIdAsync(int id)
        {
            return await _context.Shippers.FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task AddAsync(Shipper shipper)
        {
            await _context.Shippers.AddAsync(shipper);
        }

        public void Update(Shipper shipper)
        {
            _context.Shippers.Update(shipper);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
