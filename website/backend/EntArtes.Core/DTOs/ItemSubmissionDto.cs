using EntArtes.Core.Entities;

namespace EntArtes.Core.DTOs;

public class ItemSubmissionDto
{
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public GeneroItem Genero { get; set; }
    public string Tamanho { get; set; } = string.Empty;
    public string EstadoConservacao { get; set; } = string.Empty;
    public string FotoUrl { get; set; } = string.Empty;
    public decimal TaxaSimbolica { get; set; }
    public decimal? PrecoVenda { get; set; }
    public TipoItem Tipo { get; set; }
}