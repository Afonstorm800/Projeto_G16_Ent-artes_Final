using System.Collections.Generic;

namespace EntArtes.Core.Entities;

public enum TipoUtilizador
{
    Direcao,
    Professor,
    Encarregado
}

public class Utilizador
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public string SecurityStamp { get; set; } = Guid.NewGuid().ToString();
    public TipoUtilizador Tipo { get; set; }

    public ICollection<Aluno> Alunos { get; set; } = new List<Aluno>();
    public ICollection<Sessao> SessoesLecionadas { get; set; } = new List<Sessao>();
    public ICollection<DisponibilidadeProfessor> Disponibilidades { get; set; } = new List<DisponibilidadeProfessor>();
    public ICollection<ProfessorModalidade> ProfessorModalidades { get; set; } = new List<ProfessorModalidade>();
    public ICollection<Item> ItensContribuidos { get; set; } = new List<Item>();
    public ICollection<Emprestimo> Emprestimos { get; set; } = new List<Emprestimo>();
    public ICollection<Fatura> Faturas { get; set; } = new List<Fatura>();
}
