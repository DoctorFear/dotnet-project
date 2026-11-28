using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20261012000000_HuyLegacySchemaBridge")]
public partial class HuyLegacySchemaBridge : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[FPoints]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH(N'dbo.FPoints', N'Description') IS NULL
                    ALTER TABLE [dbo].[FPoints] ADD [Description] nvarchar(1000) NULL;
                IF COL_LENGTH(N'dbo.FPoints', N'SourceKey') IS NULL
                    ALTER TABLE [dbo].[FPoints] ADD [SourceKey] nvarchar(200) NULL;
                IF COL_LENGTH(N'dbo.FPoints', N'Status') IS NULL
                    ALTER TABLE [dbo].[FPoints] ADD [Status] nvarchar(20) NOT NULL
                        CONSTRAINT [DF_FPoints_Status_HuyLegacy] DEFAULT N'Available' WITH VALUES;
                IF COL_LENGTH(N'dbo.FPoints', N'AvailableAt') IS NULL
                    ALTER TABLE [dbo].[FPoints] ADD [AvailableAt] datetime2 NULL;
            END;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[FPoints]', N'U') IS NOT NULL
            BEGIN
                IF OBJECT_ID(N'[dbo].[Orders]', N'U') IS NOT NULL
                   AND COL_LENGTH(N'dbo.FPoints', N'SourceKey') IS NOT NULL
                BEGIN
                    ;WITH ExistingRewards AS
                    (
                        SELECT p.Id, p.OrderId,
                               ROW_NUMBER() OVER (PARTITION BY p.OrderId ORDER BY p.Id) AS rn
                        FROM [dbo].[FPoints] p
                        INNER JOIN [dbo].[Orders] o ON o.Id = p.OrderId AND o.UserId = p.UserId
                        WHERE p.PointUsed < 0 AND p.OrderId IS NOT NULL AND p.SourceKey IS NULL
                    )
                    UPDATE p
                       SET SourceKey = N'Order:' + CONVERT(nvarchar(20), r.OrderId) + N':Earn'
                    FROM [dbo].[FPoints] p
                    INNER JOIN ExistingRewards r ON r.Id = p.Id
                    WHERE r.rn = 1;
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[dbo].[FPoints]') AND name = N'IX_FPoints_SourceKey')
                   AND NOT EXISTS (SELECT SourceKey FROM [dbo].[FPoints] WHERE SourceKey IS NOT NULL
                    GROUP BY SourceKey HAVING COUNT(*) > 1)
                    CREATE UNIQUE INDEX [IX_FPoints_SourceKey]
                        ON [dbo].[FPoints] ([SourceKey]) WHERE [SourceKey] IS NOT NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[dbo].[FPoints]') AND name = N'IX_FPoints_UserId_CreatedAt')
                    CREATE INDEX [IX_FPoints_UserId_CreatedAt]
                        ON [dbo].[FPoints] ([UserId], [CreatedAt]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[dbo].[FPoints]') AND name = N'IX_FPoints_Status_AvailableAt')
                    CREATE INDEX [IX_FPoints_Status_AvailableAt]
                        ON [dbo].[FPoints] ([Status], [AvailableAt]);
            END;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[Orders]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH(N'dbo.Orders', N'PackingIssue') IS NULL
                    ALTER TABLE [dbo].[Orders] ADD [PackingIssue] nvarchar(1000) NULL;
                IF COL_LENGTH(N'dbo.Orders', N'ReceiptConfirmedAt') IS NULL
                    ALTER TABLE [dbo].[Orders] ADD [ReceiptConfirmedAt] datetime2 NULL;
            END;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[BookReviews]', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.BookReviews', N'VerifiedPurchaseType') IS NULL
                ALTER TABLE [dbo].[BookReviews] ADD [VerifiedPurchaseType] int NULL;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[BookReviews]', N'U') IS NOT NULL
               AND OBJECT_ID(N'[dbo].[OrderItems]', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.BookReviews', N'VerifiedPurchaseType') IS NOT NULL
            BEGIN
                ;WITH UniquePurchaseType AS
                (
                    SELECT OrderId, BookId, MIN(PurchaseType) AS PurchaseType
                    FROM [dbo].[OrderItems]
                    GROUP BY OrderId, BookId
                    HAVING MIN(PurchaseType) = MAX(PurchaseType)
                       AND MIN(PurchaseType) IN (1, 2)
                )
                UPDATE r SET r.VerifiedPurchaseType = i.PurchaseType
                FROM [dbo].[BookReviews] r
                INNER JOIN UniquePurchaseType i
                    ON i.OrderId = r.OrderId AND i.BookId = r.BookId
                WHERE r.IsVerifiedPurchase = 1;
            END;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[Shippers]', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.Shippers', N'UserId') IS NULL
                ALTER TABLE [dbo].[Shippers] ADD [UserId] int NULL;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[Shippers]', N'U') IS NOT NULL
            BEGIN
                IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
                BEGIN
                    UPDATE s SET UserId = u.Id
                    FROM [dbo].[Shippers] s
                    INNER JOIN [dbo].[Users] u ON s.Phone = u.PhoneNumber
                    WHERE s.UserId IS NULL AND u.Role = N'Shipper' AND u.IsActive = 1 AND s.Phone <> N''
                      AND (SELECT COUNT(*) FROM [dbo].[Users] x
                           WHERE x.PhoneNumber = s.Phone AND x.Role = N'Shipper') = 1
                      AND (SELECT COUNT(*) FROM [dbo].[Shippers] x WHERE x.Phone = s.Phone) = 1;

                    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                        WHERE parent_object_id = OBJECT_ID(N'[dbo].[Shippers]')
                          AND name = N'FK_Shippers_Users_UserId')
                        ALTER TABLE [dbo].[Shippers] WITH CHECK
                        ADD CONSTRAINT [FK_Shippers_Users_UserId]
                            FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]);
                END;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID(N'[dbo].[Shippers]') AND name = N'IX_Shippers_UserId')
                   AND NOT EXISTS (SELECT UserId FROM [dbo].[Shippers] WHERE UserId IS NOT NULL
                    GROUP BY UserId HAVING COUNT(*) > 1)
                    CREATE UNIQUE INDEX [IX_Shippers_UserId]
                        ON [dbo].[Shippers] ([UserId]) WHERE [UserId] IS NOT NULL;
            END;
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[FulfillmentNotification]', N'U') IS NULL
               AND OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
               AND OBJECT_ID(N'[dbo].[Orders]', N'U') IS NOT NULL
            BEGIN
                CREATE TABLE [dbo].[FulfillmentNotification]
                (
                    [Id] int IDENTITY(1,1) NOT NULL,
                    [UserId] int NULL,
                    [Audience] nvarchar(20) NOT NULL,
                    [Message] nvarchar(1000) NOT NULL,
                    [OrderId] int NULL,
                    [CreatedAt] datetime2 NOT NULL,
                    [CreatedBy] nvarchar(max) NULL,
                    [UpdatedAt] datetime2 NULL,
                    [UpdatedBy] nvarchar(max) NULL,
                    CONSTRAINT [PK_FulfillmentNotification] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_FulfillmentNotification_Orders_OrderId]
                        FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders] ([Id]),
                    CONSTRAINT [FK_FulfillmentNotification_Users_UserId]
                        FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id])
                );
                CREATE INDEX [IX_FulfillmentNotification_Audience_UserId_CreatedAt]
                    ON [dbo].[FulfillmentNotification] ([Audience], [UserId], [CreatedAt]);
                CREATE INDEX [IX_FulfillmentNotification_OrderId]
                    ON [dbo].[FulfillmentNotification] ([OrderId]);
                CREATE INDEX [IX_FulfillmentNotification_UserId]
                    ON [dbo].[FulfillmentNotification] ([UserId]);
            END;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
