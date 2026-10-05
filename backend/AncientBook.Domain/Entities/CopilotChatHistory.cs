namespace AncientBook.Domain.Entities
{
    public class CopilotChatHistory
    {
        public int Id { get; set; }
        public int EditionId { get; set; }
        public int? UserId { get; set; } // <-- Bắt buộc phải có dấu '?'
        public int? CurrentPage { get; set; }
        public string? SelectedText { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public EbookEdition? Edition { get; set; }
    }
}