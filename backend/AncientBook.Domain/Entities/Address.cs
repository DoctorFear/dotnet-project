namespace AncientBook.Domain.Entities;

public class Address
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Province { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public bool IsDefault { get; set; }

    // Navigation property
    public virtual User User { get; set; } = null!;
}