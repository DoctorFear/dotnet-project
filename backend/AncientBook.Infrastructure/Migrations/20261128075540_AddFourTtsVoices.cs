using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AncientBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFourTtsVoices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AudioUrlEnFemale",
                table: "BookTtsSegments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AudioUrlEnMale",
                table: "BookTtsSegments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AudioUrlViFemale",
                table: "BookTtsSegments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AudioUrlViMale",
                table: "BookTtsSegments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudioUrlEnFemale",
                table: "BookTtsSegments");

            migrationBuilder.DropColumn(
                name: "AudioUrlEnMale",
                table: "BookTtsSegments");

            migrationBuilder.DropColumn(
                name: "AudioUrlViFemale",
                table: "BookTtsSegments");

            migrationBuilder.DropColumn(
                name: "AudioUrlViMale",
                table: "BookTtsSegments");
        }
    }
}
