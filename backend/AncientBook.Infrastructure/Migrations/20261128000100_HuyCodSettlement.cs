using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261128000100_HuyCodSettlement")]
public partial class HuyCodSettlement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "CodCollectedAmount",
            table: "Orders",
            type: "decimal(18,2)",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "CodCollectedAt",
            table: "Orders",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "CodCollectedByShipperId",
            table: "Orders",
            type: "int",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CodSettlementStatus",
            table: "Orders",
            type: "nvarchar(30)",
            maxLength: 30,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "CodSettlementStatus", table: "Orders");
        migrationBuilder.DropColumn(name: "CodCollectedByShipperId", table: "Orders");
        migrationBuilder.DropColumn(name: "CodCollectedAt", table: "Orders");
        migrationBuilder.DropColumn(name: "CodCollectedAmount", table: "Orders");
    }
}
