using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EntArtes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCreationDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataSubmissao",
                table: "Itens",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DataPedido",
                table: "Emprestimos",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataSubmissao",
                table: "Itens");

            migrationBuilder.DropColumn(
                name: "DataPedido",
                table: "Emprestimos");
        }
    }
}
