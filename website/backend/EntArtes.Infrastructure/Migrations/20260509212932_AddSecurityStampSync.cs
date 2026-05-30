using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EntArtes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityStampSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SecurityStamp",
                table: "Utilizadores",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SecurityStamp",
                table: "Utilizadores");
        }
    }
}
