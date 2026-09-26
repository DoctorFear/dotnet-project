using System.Linq;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface ICategoryRepository
    {
        IQueryable<Category> GetQuery();
        Task<Category?> GetByIdAsync(int id);
        Task<Category?> GetByIdWithBooksAsync(int id);
        Task<bool> IsNameExistsAsync(string name, int? excludedId = null);
        void Add(Category category);
        void Remove(Category category);
        Task SaveChangesAsync();
    }
}
