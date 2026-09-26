using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class PublisherRepository : IPublisherRepository
    {
        private readonly ApplicationDbContext _context;

        public PublisherRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public IQueryable<Publisher> GetQuery()
        {
            return _context.Publishers;
        }

        public Task<Publisher?> GetByIdAsync(int id)
        {
            return _context.Publishers.FirstOrDefaultAsync(publisher => publisher.Id == id);
        }

        public Task<bool> IsNameExistsAsync(string name, int? excludedId = null)
        {
            return _context.Publishers.AnyAsync(publisher =>
                publisher.Name.ToLower() == name.ToLower() &&
                (!excludedId.HasValue || publisher.Id != excludedId.Value));
        }

        public Task<bool> HasBooksAsync(int publisherId)
        {
            return _context.Books.AnyAsync(book => book.PublisherId == publisherId);
        }

        public void Add(Publisher publisher)
        {
            _context.Publishers.Add(publisher);
        }

        public void Remove(Publisher publisher)
        {
            _context.Publishers.Remove(publisher);
        }

        public Task SaveChangesAsync()
        {
            return _context.SaveChangesAsync();
        }
    }
}
