using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HuyReviewVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VerifiedPurchaseType",
                table: "BookReviews",
                type: "int",
                nullable: true);

            // Chỉ bổ sung loại giao dịch cho đánh giá cũ khi sách trong đơn có một loại mua/thuê duy nhất.
            // Giữ null nếu không xác định được để tránh gắn nhãn sai.
            migrationBuilder.Sql("""
                UPDATE r SET r.VerifiedPurchaseType = items.PurchaseType
                FROM BookReviews r
                INNER JOIN (
                    SELECT OrderId, BookId, MIN(PurchaseType) AS PurchaseType
                    FROM OrderItems
                    GROUP BY OrderId, BookId
                    HAVING MIN(PurchaseType) = MAX(PurchaseType)
                       AND MIN(PurchaseType) IN (1, 2)
                ) items ON items.OrderId = r.OrderId AND items.BookId = r.BookId
                WHERE r.IsVerifiedPurchase = 1;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VerifiedPurchaseType",
                table: "BookReviews");
        }
    }
}
