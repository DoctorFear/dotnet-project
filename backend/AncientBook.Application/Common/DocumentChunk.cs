namespace AncientBook.Application.Common.Models
{
    public class DocumentChunk
    {
        public int? PageNumber { get; set; }
        public int ChunkIndex { get; set; }
        public string Text { get; set; } = string.Empty;

        public DocumentChunk() { }

        public DocumentChunk(int? pageNumber, int chunkIndex, string text)
        {
            PageNumber = pageNumber;
            ChunkIndex = chunkIndex;
            Text = text;
        }
    }
}