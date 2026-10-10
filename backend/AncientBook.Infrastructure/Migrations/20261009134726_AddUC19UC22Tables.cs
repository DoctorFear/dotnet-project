using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUC19UC22Tables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FPoints_Orders_OrderId",
                table: "FPoints");

            migrationBuilder.AddColumn<int>(
                name: "MembershipTierId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalSpent",
                table: "Users",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "FPoints",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateTable(
                name: "FailureReasons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReasonText = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FailureReasons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MembershipTiers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TierName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MinSpending = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PointRate = table.Column<int>(type: "int", nullable: false),
                    Benefits = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipTiers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderStatusHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    FromStatus = table.Column<int>(type: "int", nullable: false),
                    ToStatus = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ChangedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistories_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TierHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    FromTier = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ToTier = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TotalSpendingAtChange = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TriggerOrderId = table.Column<int>(type: "int", nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TierHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TierHistories_Orders_TriggerOrderId",
                        column: x => x.TriggerOrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TierHistories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderFailureReasons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    FailureReasonId = table.Column<int>(type: "int", nullable: false),
                    FailureNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AttemptNumber = table.Column<int>(type: "int", nullable: false),
                    RecordedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderFailureReasons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderFailureReasons_FailureReasons_FailureReasonId",
                        column: x => x.FailureReasonId,
                        principalTable: "FailureReasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderFailureReasons_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_MembershipTierId",
                table: "Users",
                column: "MembershipTierId");

            migrationBuilder.CreateIndex(
                name: "IX_FailureReasons_ReasonText",
                table: "FailureReasons",
                column: "ReasonText",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MembershipTiers_DisplayOrder",
                table: "MembershipTiers",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_MembershipTiers_TierName",
                table: "MembershipTiers",
                column: "TierName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderFailureReasons_FailureReasonId",
                table: "OrderFailureReasons",
                column: "FailureReasonId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderFailureReasons_OrderId",
                table: "OrderFailureReasons",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAt",
                table: "OrderStatusHistories",
                columns: new[] { "OrderId", "ChangedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TierHistories_TriggerOrderId",
                table: "TierHistories",
                column: "TriggerOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_TierHistories_UserId_ChangedAt",
                table: "TierHistories",
                columns: new[] { "UserId", "ChangedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_FPoints_Orders_OrderId",
                table: "FPoints",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_MembershipTiers_MembershipTierId",
                table: "Users",
                column: "MembershipTierId",
                principalTable: "MembershipTiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FPoints_Orders_OrderId",
                table: "FPoints");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_MembershipTiers_MembershipTierId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "MembershipTiers");

            migrationBuilder.DropTable(
                name: "OrderFailureReasons");

            migrationBuilder.DropTable(
                name: "OrderStatusHistories");

            migrationBuilder.DropTable(
                name: "TierHistories");

            migrationBuilder.DropTable(
                name: "FailureReasons");

            migrationBuilder.DropIndex(
                name: "IX_Users_MembershipTierId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MembershipTierId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TotalSpent",
                table: "Users");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "FPoints",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_FPoints_Orders_OrderId",
                table: "FPoints",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
