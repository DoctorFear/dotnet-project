using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HuyPendingPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReceiptConfirmedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AvailableAt",
                table: "FPoints",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "FPoints",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Available");

            migrationBuilder.CreateIndex(
                name: "IX_FPoints_Status_AvailableAt",
                table: "FPoints",
                columns: new[] { "Status", "AvailableAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FPoints_Status_AvailableAt",
                table: "FPoints");

            migrationBuilder.DropColumn(
                name: "ReceiptConfirmedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AvailableAt",
                table: "FPoints");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "FPoints");
        }
    }
}
