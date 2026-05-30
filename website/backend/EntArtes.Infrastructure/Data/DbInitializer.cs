using EntArtes.Core.Entities;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;

namespace EntArtes.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        // Garantir que a coluna SecurityStamp existe (caso a migração de sincronização tenha falhado anteriormente)
        try
        {
            await context.Database.ExecuteSqlRawAsync("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Utilizadores]') AND name = 'SecurityStamp') ALTER TABLE [Utilizadores] ADD [SecurityStamp] nvarchar(max) NOT NULL DEFAULT '';");
        }
        catch { /* Silencioso se falhar, MigrateAsync já deveria ter tratado */ }

        // Limpar disponibilidades antigas para garantir que as novas são carregadas
        context.DisponibilidadesProfessores.RemoveRange(context.DisponibilidadesProfessores);
        await context.SaveChangesAsync();

        // --- LIMPEZA DE DADOS ANTIGOS DO INVENTÁRIO ---
        // context.Emprestimos.RemoveRange(context.Emprestimos);
        // context.Itens.RemoveRange(context.Itens);
        // await context.SaveChangesAsync();

        if (!context.Modalidades.Any())
        {
            var modalidades = new Modalidade[]
            {
                new() { Nome = "Ballet Clássico", Descricao = "Técnica clássica com barra e centro" },
                new() { Nome = "Dança Contemporânea", Descricao = "Movimento livre e expressivo" },
                new() { Nome = "Hip Hop", Descricao = "Dança urbana e ritmos modernos" },
                new() { Nome = "Jazz", Descricao = "Energia, giros e saltos" },
                new() { Nome = "Danças Latinas", Descricao = "Salsa, Bachata, Merengue" },
                new() { Nome = "Street Dance", Descricao = "Breaking, Popping, Locking" }
            };
            context.Modalidades.AddRange(modalidades);
            await context.SaveChangesAsync();
        }

        if (!context.Estudios.Any())
        {
            var estudios = new Estudio[]
            {
                new() { Nome = "Estúdio 1", Capacidade = 15, Descricao = "Piso de madeira, espelhos" },
                new() { Nome = "Estúdio 2", Capacidade = 10, Descricao = "Espaço pequeno para aulas individuais" },
                new() { Nome = "Estúdio 3", Capacidade = 20, Descricao = "Sala ampla para ensemble" },
                new() { Nome = "Estúdio 4", Capacidade = 12, Descricao = "Piso de madeira, barra" },
                new() { Nome = "Estúdio 5", Capacidade = 8, Descricao = "Estúdio intimista" },
                new() { Nome = "Estúdio 6", Capacidade = 25, Descricao = "Palco de ensaio" },
                new() { Nome = "Estúdio 7", Capacidade = 15, Descricao = "Espelhos e equipamento de som" },
                new() { Nome = "Estúdio 8", Capacidade = 10, Descricao = "Piso de madeira" }
            };
            context.Estudios.AddRange(estudios);
            await context.SaveChangesAsync();
        }

        if (!context.EstudioModalidades.Any())
        {
            var estudios = await context.Estudios.ToListAsync();
            var ballet = await context.Modalidades.FirstAsync(m => m.Nome == "Ballet Clássico");
            var contemporanea = await context.Modalidades.FirstAsync(m => m.Nome == "Dança Contemporânea");
            var hipHop = await context.Modalidades.FirstAsync(m => m.Nome == "Hip Hop");
            var jazz = await context.Modalidades.FirstAsync(m => m.Nome == "Jazz");
            var latinas = await context.Modalidades.FirstAsync(m => m.Nome == "Danças Latinas");
            var street = await context.Modalidades.FirstAsync(m => m.Nome == "Street Dance");

            var compatibilities = new List<EstudioModalidade>();
            foreach (var e in estudios)
            {
                compatibilities.Add(new EstudioModalidade { EstudioId = e.Id, ModalidadeId = ballet.Id });
                compatibilities.Add(new EstudioModalidade { EstudioId = e.Id, ModalidadeId = contemporanea.Id });
                if (e.Id <= 3) compatibilities.Add(new EstudioModalidade { EstudioId = e.Id, ModalidadeId = hipHop.Id });
                if (e.Id >= 4 && e.Id <= 6) compatibilities.Add(new EstudioModalidade { EstudioId = e.Id, ModalidadeId = jazz.Id });
                if (e.Id >= 5 && e.Id <= 7) compatibilities.Add(new EstudioModalidade { EstudioId = e.Id, ModalidadeId = latinas.Id });
                if (e.Id >= 6) compatibilities.Add(new EstudioModalidade { EstudioId = e.Id, ModalidadeId = street.Id });
            }
            context.EstudioModalidades.AddRange(compatibilities);
            await context.SaveChangesAsync();
        }

        if (!context.Utilizadores.Any(u => u.Tipo == TipoUtilizador.Direcao))
        {
            var admin = new Utilizador
            {
                Nome = "Direção Ent'Artes",
                Email = "admin@entartes.pt",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Tipo = TipoUtilizador.Direcao
            };
            context.Utilizadores.Add(admin);
            await context.SaveChangesAsync();
        }

        var profData = new (string Nome, string Email)[]
        {
            ("Ana Silva", "ana.silva@entartes.pt"),
            ("Professor de Teste", "teste.prof@entartes.pt"),
            ("Carlos Mendes", "carlos.mendes@entartes.pt"),
            ("Mariana Costa", "mariana.costa@entartes.pt"),
            ("Rui Pereira", "rui.pereira@entartes.pt"),
            ("Sofia Rodrigues", "sofia.rodrigues@entartes.pt"),
            ("Professor Novo", "novo.prof@entartes.pt")
        };

        foreach (var p in profData)
        {
            if (!context.Utilizadores.Any(u => u.Email == p.Email))
            {
                context.Utilizadores.Add(new Utilizador 
                { 
                    Nome = p.Nome, 
                    Email = p.Email, 
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword("prof123"), 
                    Tipo = TipoUtilizador.Professor 
                });
            }
        }
        await context.SaveChangesAsync();

        if (!context.ProfessorModalidades.Any())
        {
            var professors = await context.Utilizadores.Where(u => u.Tipo == TipoUtilizador.Professor).ToListAsync();
            var ballet = await context.Modalidades.FirstAsync(m => m.Nome == "Ballet Clássico");
            var contemporanea = await context.Modalidades.FirstAsync(m => m.Nome == "Dança Contemporânea");
            var hipHop = await context.Modalidades.FirstAsync(m => m.Nome == "Hip Hop");
            var jazz = await context.Modalidades.FirstAsync(m => m.Nome == "Jazz");

            var assignments = new List<ProfessorModalidade>
            {
                new() { ProfessorId = professors[0].Id, ModalidadeId = ballet.Id },
                new() { ProfessorId = professors[0].Id, ModalidadeId = contemporanea.Id },
                new() { ProfessorId = professors[1].Id, ModalidadeId = ballet.Id },
                new() { ProfessorId = professors[1].Id, ModalidadeId = contemporanea.Id },
                new() { ProfessorId = professors[2].Id, ModalidadeId = hipHop.Id },
                new() { ProfessorId = professors[2].Id, ModalidadeId = jazz.Id },
                new() { ProfessorId = professors[3].Id, ModalidadeId = ballet.Id },
                new() { ProfessorId = professors[4].Id, ModalidadeId = contemporanea.Id },
                new() { ProfessorId = professors[5].Id, ModalidadeId = ballet.Id }
            };
            context.ProfessorModalidades.AddRange(assignments);
            await context.SaveChangesAsync();
        }

        if (!context.DisponibilidadesProfessores.Any())
        {
            var professors = await context.Utilizadores.Where(u => u.Tipo == TipoUtilizador.Professor).ToListAsync();
            var availabilities = new List<DisponibilidadeProfessor>();
            
            // Prof 0 (Ana Silva) - Seg, Ter, Qua
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[0].Id, DiaSemana = 1, HoraInicio = new TimeSpan(14, 0, 0), HoraFim = new TimeSpan(18, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[0].Id, DiaSemana = 2, HoraInicio = new TimeSpan(09, 0, 0), HoraFim = new TimeSpan(12, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[0].Id, DiaSemana = 3, HoraInicio = new TimeSpan(10, 0, 0), HoraFim = new TimeSpan(13, 0, 0), Recorrente = true });
            
            // Prof 1 (Carlos Mendes) - Ter, Qui, Sex
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[1].Id, DiaSemana = 2, HoraInicio = new TimeSpan(15, 0, 0), HoraFim = new TimeSpan(19, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[1].Id, DiaSemana = 4, HoraInicio = new TimeSpan(16, 0, 0), HoraFim = new TimeSpan(20, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[1].Id, DiaSemana = 5, HoraInicio = new TimeSpan(14, 0, 0), HoraFim = new TimeSpan(17, 0, 0), Recorrente = true });
            
            // Prof 2 (Mariana Costa) - Seg, Qua, Sex
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[2].Id, DiaSemana = 1, HoraInicio = new TimeSpan(09, 0, 0), HoraFim = new TimeSpan(12, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[2].Id, DiaSemana = 3, HoraInicio = new TimeSpan(14, 0, 0), HoraFim = new TimeSpan(18, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[2].Id, DiaSemana = 5, HoraInicio = new TimeSpan(09, 0, 0), HoraFim = new TimeSpan(13, 0, 0), Recorrente = true });

            // Prof 3 (Rui Pereira) - Ter, Qua, Qui
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[3].Id, DiaSemana = 2, HoraInicio = new TimeSpan(10, 0, 0), HoraFim = new TimeSpan(13, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[3].Id, DiaSemana = 3, HoraInicio = new TimeSpan(15, 0, 0), HoraFim = new TimeSpan(19, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[3].Id, DiaSemana = 4, HoraInicio = new TimeSpan(09, 0, 0), HoraFim = new TimeSpan(12, 0, 0), Recorrente = true });

            // Prof 4 (Sofia Rodrigues) - Seg, Qui, Sex
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[4].Id, DiaSemana = 1, HoraInicio = new TimeSpan(15, 0, 0), HoraFim = new TimeSpan(19, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[4].Id, DiaSemana = 4, HoraInicio = new TimeSpan(14, 0, 0), HoraFim = new TimeSpan(18, 0, 0), Recorrente = true });
            availabilities.Add(new DisponibilidadeProfessor { ProfessorId = professors[4].Id, DiaSemana = 5, HoraInicio = new TimeSpan(10, 0, 0), HoraFim = new TimeSpan(15, 0, 0), Recorrente = true });

            context.DisponibilidadesProfessores.AddRange(availabilities);
            await context.SaveChangesAsync();
        }

        if (!context.Utilizadores.Any(u => u.Tipo == TipoUtilizador.Encarregado))
        {
            var enc = new Utilizador
            {
                Nome = "João Pai",
                Email = "pai@example.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Tipo = TipoUtilizador.Encarregado
            };
            context.Utilizadores.Add(enc);
            await context.SaveChangesAsync();

            var enc2 = new Utilizador
            {
                Nome = "Ana Mãe",
                Email = "mae@example.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Tipo = TipoUtilizador.Encarregado
            };
            context.Utilizadores.Add(enc2);
            await context.SaveChangesAsync();

            var alunos = new Aluno[]
            {
                new() { Nome = "Maria Aluna", EncarregadoId = enc.Id },
                new() { Nome = "Pedro Aluno", EncarregadoId = enc.Id },
                new() { Nome = "Inês Aluna", EncarregadoId = enc2.Id }
            };
            context.Alunos.AddRange(alunos);
            await context.SaveChangesAsync();
        }

        if (!context.CatalogoItens.Any())
        {
            var catalogo = new CatalogoItem[]
            {
                new() { Nome = "Sapatilhas de Ballet", Categoria = "Calçado", Genero = GeneroItem.Feminino },
                new() { Nome = "Sapatilhas de Ballet", Categoria = "Calçado", Genero = GeneroItem.Masculino },
                new() { Nome = "Collant Rosa", Categoria = "Vestuário", Genero = GeneroItem.Feminino },
                new() { Nome = "T-shirt Preta Ent'Artes", Categoria = "Vestuário", Genero = GeneroItem.Unissexo },
                new() { Nome = "Sapatilhas de Pontas", Categoria = "Calçado", Genero = GeneroItem.Feminino },
                new() { Nome = "Calças de Aquecimento", Categoria = "Vestuário", Genero = GeneroItem.Unissexo },
                new() { Nome = "Rede para Cabelo", Categoria = "Acessórios", Genero = GeneroItem.Feminino }
            };
            context.CatalogoItens.AddRange(catalogo);
            await context.SaveChangesAsync();
        }

        // Aprovar automaticamente itens pendentes existentes (já que removemos o sistema de validação)
        var pendingItems = await context.Itens.Where(i => i.Estado == EstadoItem.Pendente).ToListAsync();
        foreach (var item in pendingItems)
        {
            item.Estado = EstadoItem.Aprovado;
            item.Disponivel = true;
        }
        if (pendingItems.Any()) await context.SaveChangesAsync();
    }
}
