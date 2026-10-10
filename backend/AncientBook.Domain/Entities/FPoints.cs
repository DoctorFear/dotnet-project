using AncientBook.Domain.Common;

namespace AncientBook.Domain.Entities
{
    public class FPoints : BaseEntity
    {
        public int UserId { get; set; }
        public int? OrderId { get; set; }
        public int PointUsed { get; set; }

        public User? user { get; set; }
        public Order? order { get; set; }
    }
}