using AncientBook.Domain.Common;
using AncientBook.Domain.Enums;

namespace AncientBook.Domain.Entities
{
    public class FPoints : BaseEntity
    {
        public int UserId { get; set; }
        public int? OrderId { get; set; }
        public int PointUsed { get; set; }
        public string? SourceKey { get; set; }
        public string? Description { get; set; }
        public PointStatus Status { get; set; } = PointStatus.Available;
        public DateTime? AvailableAt { get; set; }

        public User? user { get; set; }
        public Order? order { get; set; }
    }
}
