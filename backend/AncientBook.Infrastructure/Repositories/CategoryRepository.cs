using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;

        public CategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public IQueryable<Category> GetQuery()
        {
            return _context.Categories;
        }

        public Task<Category?> GetByIdAsync(int id)
        {
            return _context.Categories.FirstOrDefaultAsync(category => category.Id == id);
        }

        public Task<Category?> GetByIdWithBooksAsync(int id)
        {
            return _context.Categories
                .Include(category => category.BookCategories)
                .FirstOrDefaultAsync(category => category.Id == id);
        }

        public Task<bool> IsNameExistsAsync(string name, int? excludedId = null)
        {
            return _context.Categories.AnyAsync(category =>
                category.Name.ToLower() == name.ToLower() &&
                (!excludedId.HasValue || category.Id != excludedId.Value));
        }

        public void Add(Category category)
        {
            _context.Categories.Add(category);
        }

        public void Remove(Category category)
        {
            _context.Categories.Remove(category);
        }

        public Task SaveChangesAsync()
        {
            return _context.SaveChangesAsync();
        }
    }
}
