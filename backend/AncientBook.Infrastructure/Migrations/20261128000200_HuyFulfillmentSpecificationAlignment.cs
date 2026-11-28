using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261128000200_HuyFulfillmentSpecificationAlignment")]
public partial class HuyFulfillmentSpecificationAlignment : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ShippingCarrier",
            table: "Orders",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "AncientBook Delivery");

        migrationBuilder.AddColumn<string>(
            name: "DeliveryPriority",
            table: "Orders",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Standard");

        migrationBuilder.AddColumn<string>(
            name: "DeliveryNote",
            table: "Orders",
            type: "nvarchar(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "WaybillCode",
            table: "Orders",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ShelfLocation",
            table: "Inventories",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE [dbo].[Orders]
            SET [ShippingCarrier] = N'AncientBook Delivery'
            WHERE LTRIM(RTRIM([ShippingCarrier])) = N'';

            UPDATE [dbo].[Orders]
            SET [DeliveryPriority] = N'Standard'
            WHERE LTRIM(RTRIM([DeliveryPriority])) = N'';

            UPDATE [dbo].[Orders]
            SET [WaybillCode] = NULL
            WHERE [WaybillCode] IS NOT NULL AND LTRIM(RTRIM([WaybillCode])) = N'';

            UPDATE ordersToBackfill
            SET [WaybillCode] = CONCAT(
                N'AB-',
                CONVERT(char(8), ordersToBackfill.[OrderDate], 112),
                N'-',
                RIGHT(REPLICATE('0', 8) + CONVERT(varchar(12), ordersToBackfill.[Id]), 8))
            FROM [dbo].[Orders] ordersToBackfill
            WHERE ordersToBackfill.[WaybillCode] IS NULL
              AND (
                    ordersToBackfill.[Status] IN (3, 4, 5, 7, 8, 9)
                    OR (ordersToBackfill.[Status] = 6 AND ordersToBackfill.[ShipperId] IS NOT NULL)
                  )
              AND EXISTS (
                    SELECT 1
                    FROM [dbo].[OrderItems] orderItem
                    WHERE orderItem.[OrderId] = ordersToBackfill.[Id]
                      AND orderItem.[PurchaseType] = 1
                  );

            UPDATE [dbo].[Inventories]
            SET [ShelfLocation] = N'Kệ chờ phân bổ'
            WHERE [ShelfLocation] IS NULL OR LTRIM(RTRIM([ShelfLocation])) = N'';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ShelfLocation", table: "Inventories");
        migrationBuilder.DropColumn(name: "WaybillCode", table: "Orders");
        migrationBuilder.DropColumn(name: "DeliveryNote", table: "Orders");
        migrationBuilder.DropColumn(name: "DeliveryPriority", table: "Orders");
        migrationBuilder.DropColumn(name: "ShippingCarrier", table: "Orders");
    }
}
