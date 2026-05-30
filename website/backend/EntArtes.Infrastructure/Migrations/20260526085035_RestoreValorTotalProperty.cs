using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EntArtes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RestoreValorTotalProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "TotalHoras",
                table: "Faturas",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalHoras",
                table: "Faturas");
        }
    }
}
