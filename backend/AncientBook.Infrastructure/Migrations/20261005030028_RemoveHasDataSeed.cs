using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveHasDataSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Inventories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Books",
                columns: new[] { "Id", "Author", "CoverImg", "CreatedAt", "CreatedBy", "Description", "EBookPrice", "IsEBookAvailable", "IsPhysicalAvailable", "IsRentalAvailable", "Isbn", "Pages", "PhysicalPrice", "PublicationYear", "Publisher", "PublisherId", "Rating", "ReviewsCount", "Status", "StockCount", "StockStatus", "Title", "UpdatedAt", "UpdatedBy", "WeeklyRentalPrice", "Weight" },
                values: new object[] { 1, "Tác Giả Cổ", "https://salt.tikicdn.com/ts/product/45/3e/2e/9f992ab2a5436d4f937d9fae16d47b53.jpg", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, 50000m, true, true, true, "978-604-0-00000-1", null, 100000m, null, null, null, 0.0, 0, "Selling", 0, "InStock", "Sách Cổ Mẫu", null, null, 10000m, null });

            migrationBuilder.InsertData(
                table: "Inventories",
                columns: new[] { "Id", "BookId", "CreatedAt", "CreatedBy", "LastUpdated", "QuantityOnHand", "ReorderLevel", "UpdatedAt", "UpdatedBy" },
                values: new object[] { 1, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 50, 5, null, null });
        }
    }
}
