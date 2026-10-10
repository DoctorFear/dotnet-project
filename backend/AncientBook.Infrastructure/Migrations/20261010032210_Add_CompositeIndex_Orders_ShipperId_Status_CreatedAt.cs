using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Add_CompositeIndex_Orders_ShipperId_Status_CreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_ShipperId",
                table: "Orders");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ShipperId_Status_CreatedAt",
                table: "Orders",
                columns: new[] { "ShipperId", "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_ShipperId_Status_CreatedAt",
                table: "Orders");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ShipperId",
                table: "Orders",
                column: "ShipperId");
        }
    }
}
