using System.Collections.Generic;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface ISystemSettingRepository
    {
        Task<List<SystemSetting>> GetAllAsync();
        Task<SystemSetting?> GetByKeyAsync(string settingKey);
        void Add(SystemSetting setting);
        void AddAuditLog(AuditLog auditLog);
        Task SaveChangesAsync();
    }
}
