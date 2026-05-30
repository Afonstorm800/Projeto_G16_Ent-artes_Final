using System.Collections.Generic;

namespace EntArtes.Core.Entities;

public enum EstadoItem
{
    Privado,  // Listed but not in marketplace
    Pendente, // Submitted for approval
    Aprovado, // Active in marketplace
    Rejeitado // Rejected by direction
}

public enum TipoItem
{
    Aluguer,
    Venda
}

public enum GeneroItem
{
    Masculino,
    Feminino,
    Unissexo
}

public class Item
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public GeneroItem Genero { get; set; } = GeneroItem.Unissexo;
    public string Tamanho { get; set; } = string.Empty;
    public string EstadoConservacao { get; set; } = string.Empty;
    public string FotoUrl { get; set; } = string.Empty;
    public bool Disponivel { get; set; } = true;
    public decimal TaxaSimbolica { get; set; } = 0;
    public decimal? PrecoVenda { get; set; }
    public TipoItem Tipo { get; set; }
    public EstadoItem Estado { get; set; }
    public int Quantidade { get; set; } = 1;
    public DateTime DataSubmissao { get; set; } = DateTime.Now;

    public int ContribuidorId { get; set; }
    public Utilizador Contribuidor { get; set; } = null!;

    public Venda? Venda { get; set; }
    public ICollection<Emprestimo> Emprestimos { get; set; } = new List<Emprestimo>();
}
