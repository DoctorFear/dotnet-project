using AncientBook.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20261003110000_AddUserAuthorizationColumns")]
    public partial class AddUserAuthorizationColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH(N'[Users]', N'TokenVersion') IS NULL
                    ALTER TABLE [Users] ADD [TokenVersion] int NOT NULL CONSTRAINT [DF_Users_TokenVersion] DEFAULT 1;

                IF COL_LENGTH(N'[Users]', N'IsSuperAdmin') IS NULL
                    ALTER TABLE [Users] ADD [IsSuperAdmin] bit NOT NULL CONSTRAINT [DF_Users_IsSuperAdmin] DEFAULT 0;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
