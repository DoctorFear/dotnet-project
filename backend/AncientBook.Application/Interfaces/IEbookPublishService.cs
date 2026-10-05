using AncientBook.Domain.Enums;
using System.Threading;
using System.Threading.Tasks;

namespace AncientBook.Application.Common.Interfaces
{
    public interface IEbookPublishService
    {
        Task<bool> PublishEditionAsync(int editionId, EbookPresetType selectedPresetType, CancellationToken ct = default);
    }
}