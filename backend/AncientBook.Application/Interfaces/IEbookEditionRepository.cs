using System.Threading;
using System.Threading.Tasks;
using AncientBook.Domain.Entities;

namespace AncientBook.Application.Common.Interfaces.Repositories
{
    public interface IEbookEditionRepository
    {
        Task<EbookEdition?> GetByIdWithBookAsync(int editionId, CancellationToken ct = default);
        Task<EbookEdition?> GetByIdAsync(int editionId, CancellationToken ct = default);
        Task AddAsync(EbookEdition edition, CancellationToken ct = default);
        void Update(EbookEdition edition);
        Task<int> SaveChangesAsync(CancellationToken ct = default);
    }
}