using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HuyWorkflowSafety : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FPoints_UserId",
                table: "FPoints");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Shippers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackingIssue",
                table: "Orders",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "FPoints",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceKey",
                table: "FPoints",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FulfillmentNotification",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Audience = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FulfillmentNotification", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FulfillmentNotification_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FulfillmentNotification_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shippers_UserId",
                table: "Shippers",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_FPoints_SourceKey",
                table: "FPoints",
                column: "SourceKey",
                unique: true,
                filter: "[SourceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_FPoints_UserId_CreatedAt",
                table: "FPoints",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FulfillmentNotification_Audience_UserId_CreatedAt",
                table: "FulfillmentNotification",
                columns: new[] { "Audience", "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FulfillmentNotification_OrderId",
                table: "FulfillmentNotification",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_FulfillmentNotification_UserId",
                table: "FulfillmentNotification",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shippers_Users_UserId",
                table: "Shippers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Chỉ liên kết hồ sơ khớp duy nhất; Shippers.Id không phải là Users.Id.
            var backfillSql = """
                UPDATE s SET UserId = u.Id
                FROM Shippers s JOIN Users u ON s.Phone = u.PhoneNumber
                WHERE u.Role = N'Shipper' AND u.IsActive = 1 AND s.Phone <> N''
                  AND (SELECT COUNT(*) FROM Users x WHERE x.PhoneNumber = s.Phone AND x.Role = N'Shipper') = 1
                  AND (SELECT COUNT(*) FROM Shippers x WHERE x.Phone = s.Phone) = 1;
                WITH ExistingRewards AS (
                    SELECT p.Id, p.OrderId,
                        ROW_NUMBER() OVER (PARTITION BY p.OrderId ORDER BY p.Id) AS rn
                    FROM FPoints p JOIN Orders o ON o.Id = p.OrderId AND o.UserId = p.UserId
                    WHERE p.PointUsed < 0
                )
                UPDATE p SET SourceKey = N'Order:' + CONVERT(nvarchar(20), r.OrderId) + N':Earn'
                FROM FPoints p JOIN ExistingRewards r ON r.Id = p.Id WHERE r.rn = 1;
                """;
            // Dùng SQL động để script idempotent có thể thêm cột và truy cập cột đó trong cùng batch.
            migrationBuilder.Sql("EXEC(N'" + backfillSql.Replace("'", "''") + "');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shippers_Users_UserId",
                table: "Shippers");

            migrationBuilder.DropTable(
                name: "FulfillmentNotification");

            migrationBuilder.DropIndex(
                name: "IX_Shippers_UserId",
                table: "Shippers");

            migrationBuilder.DropIndex(
                name: "IX_FPoints_SourceKey",
                table: "FPoints");

            migrationBuilder.DropIndex(
                name: "IX_FPoints_UserId_CreatedAt",
                table: "FPoints");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Shippers");

            migrationBuilder.DropColumn(
                name: "PackingIssue",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "FPoints");

            migrationBuilder.DropColumn(
                name: "SourceKey",
                table: "FPoints");

            migrationBuilder.CreateIndex(
                name: "IX_FPoints_UserId",
                table: "FPoints",
                column: "UserId");
        }
    }
}
