namespace EntArtes.Core.Entities;

public class CatalogoItem
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public GeneroItem Genero { get; set; }
}
