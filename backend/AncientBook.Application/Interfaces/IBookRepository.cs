using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Interfaces
{
    public interface IBookRepository
    {
        Task<Book?> GetByIdAsync(int id);
    }
}