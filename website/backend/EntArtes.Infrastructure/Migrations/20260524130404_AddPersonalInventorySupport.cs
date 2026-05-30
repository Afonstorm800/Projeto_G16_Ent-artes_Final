using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EntArtes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalInventorySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vendas_ItemId",
                table: "Vendas");

            migrationBuilder.CreateIndex(
                name: "IX_Vendas_ItemId",
                table: "Vendas",
                column: "ItemId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vendas_ItemId",
                table: "Vendas");

            migrationBuilder.CreateIndex(
                name: "IX_Vendas_ItemId",
                table: "Vendas",
                column: "ItemId");
        }
    }
}
