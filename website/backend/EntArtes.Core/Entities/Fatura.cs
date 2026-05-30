using System;
using System.Collections.Generic;

namespace EntArtes.Core.Entities;

public class Fatura
{
    public int Id { get; set; }
    public int Mes { get; set; }
    public int Ano { get; set; }
    public DateTime DataEmissao { get; set; }
    public double TotalHoras { get; set; }
    public decimal ValorTotal { get; set; }
    public bool Paga { get; set; } = false;

    public int UtilizadorId { get; set; }
    public Utilizador Utilizador { get; set; } = null!;

    public ICollection<Sessao> Sessoes { get; set; } = new List<Sessao>();
}
