namespace AncientBook.Domain.Entities
{
    public class BookCategory
    {
        public int BookId { get; set; }
        public Book? Book { get; set; }

        public int CategoryId { get; set; }
    }
}