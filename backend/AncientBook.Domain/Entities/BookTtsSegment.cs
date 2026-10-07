using System;

namespace AncientBook.Domain.Entities
{
    public class BookTtsSegment
    {
        public int Id { get; set; }
        public int EditionId { get; set; }
        public int PageNumber { get; set; }
        public int SegmentIndex { get; set; } // Thứ tự khối trên trang: 0, 1, 2...
        public string TextContent { get; set; } = string.Empty;
        public string AudioUrlFemale { get; set; } = string.Empty;
        public string AudioUrlMale { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public EbookEdition? Edition { get; set; }
    }
}