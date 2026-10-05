using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEbookEditionToPresetEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EbookEditions_EbookPresets_PresetId",
                table: "EbookEditions");

            migrationBuilder.DropTable(
                name: "EbookPresets");

            migrationBuilder.DropIndex(
                name: "IX_EbookEditions_PresetId",
                table: "EbookEditions");

            migrationBuilder.RenameColumn(
                name: "PresetId",
                table: "EbookEditions",
                newName: "PresetType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PresetType",
                table: "EbookEditions",
                newName: "PresetId");

            migrationBuilder.CreateTable(
                name: "EbookPresets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnableAiAssistant = table.Column<bool>(type: "bit", nullable: false),
                    EnableAiVoice = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReaderLayoutMode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EbookPresets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EbookEditions_PresetId",
                table: "EbookEditions",
                column: "PresetId");

            migrationBuilder.AddForeignKey(
                name: "FK_EbookEditions_EbookPresets_PresetId",
                table: "EbookEditions",
                column: "PresetId",
                principalTable: "EbookPresets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
