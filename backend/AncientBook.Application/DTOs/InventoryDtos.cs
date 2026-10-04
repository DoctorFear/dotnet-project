namespace AncientBook.Application.DTOs
{
	public class StockAlertDto
	{
		public int Id { get; set; }
		public int BookId { get; set; }
		public string BookTitle { get; set; } = string.Empty;
		public string Isbn { get; set; } = string.Empty;
		public int CurrentStock { get; set; }
		public int MinThreshold { get; set; }
		public string Status { get; set; } = string.Empty; // LowStock, OutOfStock
		public bool IsResolved { get; set; }
		public DateTime CreatedAt { get; set; }
	}

	public class UpdateThresholdDto
	{
		public int BookId { get; set; }
		public int NewThreshold { get; set; }
	}
}
