using System;

namespace EntArtes.Core.Entities;

public class Venda
{
    public int Id { get; set; }
    public DateTime DataVenda { get; set; }
    public decimal PrecoFinal { get; set; }
    
    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;
    
    public int UtilizadorId { get; set; }
    public Utilizador Comprador { get; set; } = null!;
}