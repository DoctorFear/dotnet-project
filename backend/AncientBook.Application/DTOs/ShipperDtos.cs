namespace AncientBook.Application.DTOs
{
    public class ShipperDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active, Busy, Off
        public int MaxConcurrentOrders { get; set; } = 5;
        public int ActiveOrdersCount { get; set; }
    }

    public class AssignShipperDto
    {
        public int OrderId { get; set; }
        public int ShipperId { get; set; }
    }

    public class UpdateShipperStatusDto
    {
        public string Status { get; set; } = "Active"; // Active, Busy, Off
    }
}
