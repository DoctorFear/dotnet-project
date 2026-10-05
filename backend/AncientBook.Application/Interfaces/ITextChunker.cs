using System.Collections.Generic;
using AncientBook.Application.Common.Models;

namespace AncientBook.Application.Common.Interfaces
{
    public interface ITextChunker
    {
        List<DocumentChunk> ChunkText(List<(int? PageNum, string Content)> pages);
    }
}