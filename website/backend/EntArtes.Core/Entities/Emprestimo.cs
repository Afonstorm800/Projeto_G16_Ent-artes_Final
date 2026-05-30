using System;

namespace EntArtes.Core.Entities;

public enum EstadoEmprestimo
{
    Pendente,
    Aprovado,
    DevolvidoPelaDirecao, // Direção confirmou receção física
    Devolvido,            // Pai confirmou online (Estado final)
    Rejeitado
}

public class Emprestimo
{
    public int Id { get; set; }
    public DateTime DataInicio { get; set; }
    public DateTime DataFimPrevisto { get; set; }
    public DateTime? DataDevolucao { get; set; }
    public DateTime DataPedido { get; set; } = DateTime.Now;
    public EstadoEmprestimo Estado { get; set; }
    public decimal TaxaAplicada { get; set; }

    public int ItemId { get; set; }
    public int UtilizadorId { get; set; }

    public Item Item { get; set; } = null!;
    public Utilizador Utilizador { get; set; } = null!;
}
