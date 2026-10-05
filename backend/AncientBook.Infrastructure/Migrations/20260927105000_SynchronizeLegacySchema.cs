using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using AncientBook.Infrastructure.Persistence;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260927105000_SynchronizeLegacySchema")]
    public partial class SynchronizeLegacySchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH(N'[Users]', N'RefreshToken') IS NULL
                    ALTER TABLE [Users] ADD [RefreshToken] nvarchar(max) NULL;

                IF COL_LENGTH(N'[Users]', N'RefreshTokenExpiryTime') IS NULL
                    ALTER TABLE [Users] ADD [RefreshTokenExpiryTime] datetime2 NULL;
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[Addresses]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Addresses] (
                        [Id] int NOT NULL IDENTITY,
                        [UserId] int NOT NULL,
                        [Province] nvarchar(max) NOT NULL,
                        [Ward] nvarchar(max) NOT NULL,
                        [StreetAddress] nvarchar(max) NOT NULL,
                        [IsDefault] bit NOT NULL,
                        CONSTRAINT [PK_Addresses] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_Addresses_Users_UserId] FOREIGN KEY ([UserId])
                            REFERENCES [Users] ([Id]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_Addresses_UserId] ON [Addresses] ([UserId]);
                END
                """);

            migrationBuilder.Sql("""
                ALTER TABLE [Suppliers] ALTER COLUMN [Name] nvarchar(255) NOT NULL;
                ALTER TABLE [Suppliers] ALTER COLUMN [Address] nvarchar(500) NOT NULL;
                ALTER TABLE [PurchaseOrders] ALTER COLUMN [Notes] nvarchar(500) NOT NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
