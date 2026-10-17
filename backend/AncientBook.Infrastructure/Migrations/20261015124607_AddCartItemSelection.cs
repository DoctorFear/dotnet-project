using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCartItemSelection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH(N'[dbo].[CartItems]', N'isSelected') IS NULL
                    ALTER TABLE [dbo].[CartItems] ADD [isSelected] bit NOT NULL
                        CONSTRAINT [DF_CartItems_isSelected] DEFAULT CAST(1 AS bit);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "isSelected", table: "CartItems");
        }
    }
}
