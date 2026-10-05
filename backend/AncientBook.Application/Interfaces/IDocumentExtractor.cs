using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Common.Interfaces
{
    public interface IDocumentExtractor
    {
        Task<(int TotalPages, long FileSize)> InspectMetadataAsync(Stream fileStream, EbookFormat format);
        Task<List<(int? PageNum, string Content)>> ExtractRawPagesAsync(Stream fileStream, EbookFormat format, CancellationToken ct = default);
    }
}