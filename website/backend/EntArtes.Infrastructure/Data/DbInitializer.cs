using EntArtes.Core.Entities;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;

namespace EntArtes.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

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

        // --- TEST DATA: MARKETPLACE ---
        if (!context.Itens.Any())
        {
            var enc1 = await context.Utilizadores.FirstAsync(u => u.Email == "pai@example.com");
            var enc2 = await context.Utilizadores.FirstAsync(u => u.Email == "mae@example.com");

            var itens = new List<Item>
            {
                // Venda
                new() { Nome = "Sapatilhas Profissionais", Descricao = "Usadas apenas 2 vezes, tamanho 38.", Categoria = "Calçado", Genero = GeneroItem.Feminino, Tamanho = "38", EstadoConservacao = "Excelente", Tipo = TipoItem.Venda, PrecoVenda = 25.00m, Disponivel = true, Estado = EstadoItem.Aprovado, ContribuidorId = enc1.Id },
                new() { Nome = "Saco de Dança", Descricao = "Saco espaçoso com vários compartimentos.", Categoria = "Acessórios", Genero = GeneroItem.Unissexo, Tamanho = "Único", EstadoConservacao = "Bom", Tipo = TipoItem.Venda, PrecoVenda = 15.00m, Disponivel = false, Estado = EstadoItem.Aprovado, ContribuidorId = enc2.Id },
                new() { Nome = "CD Música Clássica", Descricao = "Coletânea para ensaio de ballet em casa.", Categoria = "Acessórios", Genero = GeneroItem.Unissexo, Tamanho = "N/A", EstadoConservacao = "Usado", Tipo = TipoItem.Venda, PrecoVenda = 5.00m, Disponivel = true, Estado = EstadoItem.Aprovado, ContribuidorId = enc1.Id },
                
                // Aluguer
                new() { Nome = "Collant de Exame", Descricao = "Collant oficial para exame de Grau 2.", Categoria = "Vestuário", Genero = GeneroItem.Feminino, Tamanho = "M", EstadoConservacao = "Bom", Tipo = TipoItem.Aluguer, TaxaSimbolica = 2.00m, Disponivel = true, Estado = EstadoItem.Aprovado, ContribuidorId = enc2.Id },
                new() { Nome = "Tutu de Palco", Descricao = "Tutu rígido branco para espetáculo.", Categoria = "Figurino", Genero = GeneroItem.Feminino, Tamanho = "S", EstadoConservacao = "Novo", Tipo = TipoItem.Aluguer, TaxaSimbolica = 5.00m, Disponivel = false, Estado = EstadoItem.Aprovado, ContribuidorId = enc1.Id },
                new() { Nome = "Fato de Hip Hop", Descricao = "Conjunto baggy verde neon.", Categoria = "Figurino", Genero = GeneroItem.Unissexo, Tamanho = "L", EstadoConservacao = "Bom", Tipo = TipoItem.Aluguer, TaxaSimbolica = 3.50m, Disponivel = true, Estado = EstadoItem.Aprovado, ContribuidorId = enc2.Id },
                new() { Nome = "Barras Portáteis", Descricao = "Par de barras leves para treino.", Categoria = "Equipamento", Genero = GeneroItem.Unissexo, Tamanho = "N/A", EstadoConservacao = "Desgastado", Tipo = TipoItem.Aluguer, TaxaSimbolica = 10.00m, Disponivel = false, Estado = EstadoItem.Aprovado, ContribuidorId = enc1.Id },

                // Pendentes/Outros Estados
                new() { Nome = "Rede de Cabelo (Nova)", Descricao = "Cor castanha, nunca aberta.", Categoria = "Acessórios", Genero = GeneroItem.Feminino, Tamanho = "Único", EstadoConservacao = "Novo", Tipo = TipoItem.Venda, PrecoVenda = 1.50m, Disponivel = true, Estado = EstadoItem.Pendente, ContribuidorId = enc2.Id },
                new() { Nome = "Sapatilhas Furadas", Descricao = "Para peças de museu ou piada.", Categoria = "Calçado", Genero = GeneroItem.Unissexo, Tamanho = "40", EstadoConservacao = "Muito Usado", Tipo = TipoItem.Venda, PrecoVenda = 0.50m, Disponivel = true, Estado = EstadoItem.Rejeitado, ContribuidorId = enc1.Id }
            };
            context.Itens.AddRange(itens);
            await context.SaveChangesAsync();

            // Transactions History
            var itemVendido = await context.Itens.FirstAsync(i => i.Nome == "Saco de Dança");
            context.Vendas.Add(new Venda { ItemId = itemVendido.Id, UtilizadorId = enc1.Id, DataVenda = DateTime.Now.AddDays(-10), PrecoFinal = 15.00m });

            var itemAlugado1 = await context.Itens.FirstAsync(i => i.Nome == "Tutu de Palco");
            context.Emprestimos.Add(new Emprestimo { ItemId = itemAlugado1.Id, UtilizadorId = enc2.Id, DataInicio = DateTime.Now.AddDays(-5), DataFimPrevisto = DateTime.Now.AddDays(2), Estado = EstadoEmprestimo.Aprovado, TaxaAplicada = 5.00m });
            
            var itemAlugado2 = await context.Itens.FirstAsync(i => i.Nome == "Barras Portáteis");
            context.Emprestimos.Add(new Emprestimo { ItemId = itemAlugado2.Id, UtilizadorId = enc2.Id, DataInicio = DateTime.Now.AddDays(-20), DataFimPrevisto = DateTime.Now.AddDays(-15), DataDevolucao = DateTime.Now.AddDays(-14), Estado = EstadoEmprestimo.DevolvidoPelaDirecao, TaxaAplicada = 10.00m });

            await context.SaveChangesAsync();
        }

        // --- TEST DATA: SESSIONS ---
        if (!context.Sessoes.Any())
        {
            var professors = await context.Utilizadores.Where(u => u.Tipo == TipoUtilizador.Professor).ToListAsync();
            var modalities = await context.Modalidades.ToListAsync();
            var studios = await context.Estudios.ToListAsync();
            var student = await context.Alunos.FirstAsync();

            var monday = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek + (int)DayOfWeek.Monday);
            
            var sessoes = new List<Sessao>
            {
                // Monday: Regular classes
                new() { DataHoraInicio = monday.AddHours(10), DataHoraFim = monday.AddHours(11), Estado = EstadoSessao.Agendada, Formato = FormatoAula.Individual, ProfessorId = professors[0].Id, ModalidadeId = modalities[0].Id, EstudioId = studios[0].Id, Preco = 30m },
                new() { DataHoraInicio = monday.AddHours(11), DataHoraFim = monday.AddHours(12), Estado = EstadoSessao.Agendada, Formato = FormatoAula.Individual, ProfessorId = professors[0].Id, ModalidadeId = modalities[1].Id, EstudioId = studios[1].Id, Preco = 30m },
                
                // Wednesday: Multi-student class
                new() { DataHoraInicio = monday.AddDays(2).AddHours(15), DataHoraFim = monday.AddDays(2).AddHours(17), Estado = EstadoSessao.Agendada, Formato = FormatoAula.Ensemble, ProfessorId = professors[1].Id, ModalidadeId = modalities[2].Id, EstudioId = studios[2].Id, Preco = 80m },
                
                // Friday: Pending approvals
                new() { DataHoraInicio = monday.AddDays(4).AddHours(14), DataHoraFim = monday.AddDays(4).AddHours(15), Estado = EstadoSessao.PendenteProfessor, Formato = FormatoAula.Individual, ProfessorId = professors[2].Id, ModalidadeId = modalities[0].Id, EstudioId = studios[3].Id, Preco = 30m, Objetivo = "Ensaio Solo" },
                new() { DataHoraInicio = monday.AddDays(4).AddHours(16), DataHoraFim = monday.AddDays(4).AddHours(17), Estado = EstadoSessao.PendenteDirecao, Formato = FormatoAula.Dueto, ProfessorId = professors[3].Id, ModalidadeId = modalities[1].Id, EstudioId = studios[4].Id, Preco = 45m, Objetivo = "Aperfeiçoamento Técnico" },

                // Weekend: Special workshop
                new() { DataHoraInicio = monday.AddDays(5).AddHours(10), DataHoraFim = monday.AddDays(5).AddHours(13), Estado = EstadoSessao.Agendada, Formato = FormatoAula.Ensemble, ProfessorId = professors[4].Id, ModalidadeId = modalities[3].Id, EstudioId = studios[5].Id, Preco = 100m, Objetivo = "Workshop Intensivo Jazz" }
            };
            context.Sessoes.AddRange(sessoes);
            await context.SaveChangesAsync();

            // Link students to some sessions
            var allSessoes = await context.Sessoes.ToListAsync();
            var allStudents = await context.Alunos.ToListAsync();

            foreach (var s in allSessoes)
            {
                // Everyone in the ensemble, otherwise just the first student
                if (s.Formato == FormatoAula.Ensemble)
                {
                    foreach (var al in allStudents)
                        context.Participantes.Add(new Participante { SessaoId = s.Id, AlunoId = al.Id });
                }
                else
                {
                    context.Participantes.Add(new Participante { SessaoId = s.Id, AlunoId = allStudents[0].Id });
                }
            }
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
