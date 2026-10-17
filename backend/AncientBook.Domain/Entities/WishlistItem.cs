namespace AncientBook.Domain.Entities;

public class WishlistItem
{
    public int UserId { get; set; }
    public int BookId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Book Book { get; set; } = null!;
}
