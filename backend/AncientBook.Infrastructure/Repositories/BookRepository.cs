using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Infrastructure.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly ApplicationDbContext _context;

        public BookRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        
        public IQueryable<Book> GetBookListQuery()
        {
            return _context.Books
                .Include(book => book.PublisherEntity)
                .Include(book => book.BookCategories)
                .ThenInclude(bookCategory => bookCategory.Category)
                .AsSplitQuery();
        }

        public Task<Book?> GetDetailByIdAsync(int id)
        {
            return _context.Books
                .Include(book => book.PublisherEntity)
                .Include(book => book.BookCategories)
                .ThenInclude(bookCategory => bookCategory.Category)
                .Include(book => book.BookImages)
                .AsSplitQuery()
                .FirstOrDefaultAsync(book => book.Id == id);
        }

        public Task<Book?> GetForUpdateAsync(int id)
        {
            return _context.Books
                .Include(book => book.BookCategories)
                .Include(book => book.BookImages)
                .AsSplitQuery()
                .FirstOrDefaultAsync(book => book.Id == id);
        }

        public Task<Book?> GetForDeleteAsync(int id)
        {
            return _context.Books
                .Include(book => book.OrderItems)
                .FirstOrDefaultAsync(book => book.Id == id);
        }

        public Task<Book?> GetByIdAsync(int id)
        {
            return _context.Books.FirstOrDefaultAsync(book => book.Id == id);
        }

        public Task<bool> IsIsbnExistsAsync(string isbn)
        {
            return _context.Books.AnyAsync(book => book.Isbn == isbn);
        }

        public void Add(Book book)
        {
            _context.Books.Add(book);
        }

        public void Remove(Book book)
        {
            _context.Books.Remove(book);
        }

        public void RemoveBookCategories(IEnumerable<BookCategory> bookCategories)
        {
            _context.BookCategories.RemoveRange(bookCategories);
        }

        public void RemoveBookImages(IEnumerable<BookImage> bookImages)
        {
            _context.BookImages.RemoveRange(bookImages);
        }

        public Task SaveChangesAsync()
        {
            return _context.SaveChangesAsync();
        }
    }
}
