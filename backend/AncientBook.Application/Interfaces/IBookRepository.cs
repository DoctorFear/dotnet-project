using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IBookRepository
    {
        Task<Book?> GetByIdAsync(int id);
        IQueryable<Book> GetBookListQuery();
        Task<Book?> GetDetailByIdAsync(int id);
        Task<Book?> GetForUpdateAsync(int id);
        Task<Book?> GetForDeleteAsync(int id);
        Task<bool> IsIsbnExistsAsync(string isbn);
        void Add(Book book);
        void Remove(Book book);
        void RemoveBookCategories(IEnumerable<BookCategory> bookCategories);
        void RemoveBookImages(IEnumerable<BookImage> bookImages);
        Task SaveChangesAsync();
    }
}
