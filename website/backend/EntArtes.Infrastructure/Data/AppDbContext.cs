using Microsoft.EntityFrameworkCore;
using EntArtes.Core.Entities;

namespace EntArtes.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Utilizador> Utilizadores { get; set; }
    public DbSet<Aluno> Alunos { get; set; }
    public DbSet<Estudio> Estudios { get; set; }
    public DbSet<Modalidade> Modalidades { get; set; }
    public DbSet<EstudioModalidade> EstudioModalidades { get; set; }
    public DbSet<ProfessorModalidade> ProfessorModalidades { get; set; }
    public DbSet<DisponibilidadeProfessor> DisponibilidadesProfessores { get; set; }
    public DbSet<Sessao> Sessoes { get; set; }
    public DbSet<Participante> Participantes { get; set; }
    public DbSet<Item> Itens { get; set; }
    public DbSet<CatalogoItem> CatalogoItens { get; set; }
    public DbSet<Emprestimo> Emprestimos { get; set; }
    public DbSet<Venda> Vendas { get; set; }
    public DbSet<Fatura> Faturas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Many-to-many: Estudio <-> Modalidade
        modelBuilder.Entity<EstudioModalidade>()
            .HasKey(em => new { em.EstudioId, em.ModalidadeId });

        modelBuilder.Entity<EstudioModalidade>()
            .HasOne(em => em.Estudio)
            .WithMany(e => e.ModalidadesCompativeis)
            .HasForeignKey(em => em.EstudioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EstudioModalidade>()
            .HasOne(em => em.Modalidade)
            .WithMany(m => m.EstudiosCompativeis)
            .HasForeignKey(em => em.ModalidadeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Many-to-many: Utilizador (Professor) <-> Modalidade
        modelBuilder.Entity<ProfessorModalidade>()
            .HasKey(pm => new { pm.ProfessorId, pm.ModalidadeId });

        modelBuilder.Entity<ProfessorModalidade>()
            .HasOne(pm => pm.Professor)
            .WithMany(u => u.ProfessorModalidades)
            .HasForeignKey(pm => pm.ProfessorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProfessorModalidade>()
            .HasOne(pm => pm.Modalidade)
            .WithMany(m => m.ProfessoresHabilitados)
            .HasForeignKey(pm => pm.ModalidadeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Aluno -> Encarregado
        modelBuilder.Entity<Aluno>()
            .HasOne(a => a.Encarregado)
            .WithMany(u => u.Alunos)
            .HasForeignKey(a => a.EncarregadoId)
            .OnDelete(DeleteBehavior.Restrict);

        // DisponibilidadeProfessor
        modelBuilder.Entity<DisponibilidadeProfessor>()
            .HasOne(dp => dp.Professor)
            .WithMany(u => u.Disponibilidades)
            .HasForeignKey(dp => dp.ProfessorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Sessao
        modelBuilder.Entity<Sessao>()
            .HasOne(s => s.Estudio)
            .WithMany(e => e.Sessoes)
            .HasForeignKey(s => s.EstudioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sessao>()
            .HasOne(s => s.Professor)
            .WithMany(u => u.SessoesLecionadas)
            .HasForeignKey(s => s.ProfessorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sessao>()
            .HasOne(s => s.Modalidade)
            .WithMany(m => m.Sessoes)
            .HasForeignKey(s => s.ModalidadeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Sessao>()
            .HasOne(s => s.Fatura)
            .WithMany(f => f.Sessoes)
            .HasForeignKey(s => s.FaturaId)
            .OnDelete(DeleteBehavior.SetNull);

        // Participante
        modelBuilder.Entity<Participante>()
            .HasKey(p => new { p.SessaoId, p.AlunoId });

        modelBuilder.Entity<Participante>()
            .HasOne(p => p.Sessao)
            .WithMany(s => s.Participantes)
            .HasForeignKey(p => p.SessaoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Participante>()
            .HasOne(p => p.Aluno)
            .WithMany(a => a.Participacoes)
            .HasForeignKey(p => p.AlunoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Item
        modelBuilder.Entity<Item>()
            .HasOne(i => i.Contribuidor)
            .WithMany(u => u.ItensContribuidos)
            .HasForeignKey(i => i.ContribuidorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Emprestimo
        modelBuilder.Entity<Emprestimo>()
            .HasOne(e => e.Item)
            .WithMany(i => i.Emprestimos)
            .HasForeignKey(e => e.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Emprestimo>()
            .HasOne(e => e.Utilizador)
            .WithMany(u => u.Emprestimos)
            .HasForeignKey(e => e.UtilizadorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Venda
        modelBuilder.Entity<Venda>()
            .HasOne(v => v.Item)
            .WithOne(i => i.Venda)
            .HasForeignKey<Venda>(v => v.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Venda>()
            .HasOne(v => v.Comprador)
            .WithMany()
            .HasForeignKey(v => v.UtilizadorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Fatura
        modelBuilder.Entity<Fatura>()
            .HasOne(f => f.Utilizador)
            .WithMany(u => u.Faturas)
            .HasForeignKey(f => f.UtilizadorId)
            .OnDelete(DeleteBehavior.Cascade);

        // SQLite doesn't support HasPrecision, and it's not strictly necessary for it.
    }
}
