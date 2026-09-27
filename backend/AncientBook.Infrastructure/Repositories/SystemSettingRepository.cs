using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class SystemSettingRepository : ISystemSettingRepository
    {
        private readonly ApplicationDbContext _context;

        public SystemSettingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public Task<List<SystemSetting>> GetAllAsync()
        {
            return _context.SystemSettings.ToListAsync();
        }

        public Task<SystemSetting?> GetByKeyAsync(string settingKey)
        {
            return _context.SystemSettings.FirstOrDefaultAsync(setting => setting.SettingKey == settingKey);
        }

        public void Add(SystemSetting setting)
        {
            _context.SystemSettings.Add(setting);
        }

        public void AddAuditLog(AuditLog auditLog)
        {
            _context.AuditLogs.Add(auditLog);
        }

        public Task SaveChangesAsync()
        {
            return _context.SaveChangesAsync();
        }
    }
}
