using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs;

namespace AncientBook.Application.Interfaces
{
    // Interface xử lý nghiệp vụ Sách 
    public interface IBookService
    {
        Task<PagedResult<BookListDto>> GetFilteredBooksAsync(BookFilterRequestDto filter);
        Task<BookDetailDto?> GetBookDetailByIdAsync(int id);
        Task<BookDetailDto> CreateBookAsync(SaveBookDto dto, int currentUserId);
        Task<BookDetailDto?> UpdateBookAsync(int id, SaveBookDto dto, int currentUserId);
        Task<bool> UpdateBookStatusAsync(int id, string status, int currentUserId);
        Task<bool> DeleteBookAsync(int id, int currentUserId);
    }
}