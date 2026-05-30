using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EntArtes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInventorySystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Genero",
                table: "Itens",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Quantidade",
                table: "Itens",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Tamanho",
                table: "Itens",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CatalogoItens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Genero = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogoItens", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogoItens");

            migrationBuilder.DropColumn(
                name: "Genero",
                table: "Itens");

            migrationBuilder.DropColumn(
                name: "Quantidade",
                table: "Itens");

            migrationBuilder.DropColumn(
                name: "Tamanho",
                table: "Itens");
        }
    }
}
