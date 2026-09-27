using System.Linq;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IPublisherRepository
    {
        IQueryable<Publisher> GetQuery();
        Task<Publisher?> GetByIdAsync(int id);
        Task<bool> IsNameExistsAsync(string name, int? excludedId = null);
        Task<bool> HasBooksAsync(int publisherId);
        void Add(Publisher publisher);
        void Remove(Publisher publisher);
        Task SaveChangesAsync();
    }
}
