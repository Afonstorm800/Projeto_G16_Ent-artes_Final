using EntArtes.API.Controllers;
using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using EntArtes.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EntArtes.Tests;

public class DashboardControllerTests
{
    private AppDbContext GetDatabaseContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var databaseContext = new AppDbContext(options);
        databaseContext.Database.EnsureCreated();
        return databaseContext;
    }

    [Fact]
    public async Task GetStats_ShouldReturnCorrectCounts()
    {
        // Arrange
        var context = GetDatabaseContext();
        
        // Seed Utilizador (for items and loans)
        var user = new Utilizador { Id = 1, Nome = "Test User", Email = "test@test.com" };
        context.Utilizadores.Add(user);

        // Seed Alunos
        context.Alunos.Add(new Aluno { Id = 1, Nome = "Aluno 1", EncarregadoId = 1 });
        context.Alunos.Add(new Aluno { Id = 2, Nome = "Aluno 2", EncarregadoId = 1 });

        // Seed Itens (1 pendente, 1 aprovado)
        context.Itens.Add(new Item { Id = 1, Nome = "Item P", Estado = EstadoItem.Pendente, ContribuidorId = 1 });
        context.Itens.Add(new Item { Id = 2, Nome = "Item A", Estado = EstadoItem.Aprovado, ContribuidorId = 1 });

        // Seed Emprestimos (1 ativo/aprovado, 1 devolvido)
        context.Emprestimos.Add(new Emprestimo { Id = 1, ItemId = 2, Estado = EstadoEmprestimo.Aprovado, UtilizadorId = 1 });
        context.Emprestimos.Add(new Emprestimo { Id = 2, ItemId = 2, Estado = EstadoEmprestimo.Devolvido, UtilizadorId = 1 });

        await context.SaveChangesAsync();

        var controller = new DashboardController(context);
        
        // Simulate Direcao user
        var claims = new List<System.Security.Claims.Claim> 
        { 
            new(System.Security.Claims.ClaimTypes.NameIdentifier, "1"),
            new(System.Security.Claims.ClaimTypes.Role, "Direcao")
        };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext 
            { 
                User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(claims)) 
            }
        };

        // Act
        var result = await controller.GetStats();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var stats = Assert.IsType<DashboardStatsDto>(okResult.Value);

        // Based on Direcao logic in Controller:
        // Stat1 = Pendentes (1 item + 0 loan) = 1
        // Stat3 = Aprovados (1 item) = 1
        // Stat4 = Total Alunos = 2
        Assert.Equal(1, stats.Stat1);
        Assert.Equal(1, stats.Stat3);
        Assert.Equal(2, stats.Stat4);
        Assert.NotEmpty(stats.RecentActivities);
    }

    [Fact]
    public async Task GetStats_ShouldReturnProfessorMetrics()
    {
        // Arrange
        var context = GetDatabaseContext();
        var professorId = 2;
        context.Utilizadores.Add(new Utilizador { Id = professorId, Nome = "Prof", Tipo = TipoUtilizador.Professor });
        
        // 1. Session to accept
        context.Sessoes.Add(new Sessao { Id = 1, ProfessorId = professorId, Estado = EstadoSessao.PendenteProfessor });
        
        // 2. Session scheduled for this week
        context.Sessoes.Add(new Sessao { Id = 2, ProfessorId = professorId, Estado = EstadoSessao.Agendada, DataHoraInicio = DateTime.Now.AddDays(1) });
        
        // 3. Session to validate
        context.Sessoes.Add(new Sessao { Id = 3, ProfessorId = professorId, Estado = EstadoSessao.ProntoValidar });

        await context.SaveChangesAsync();

        var controller = new DashboardController(context);
        var claims = new List<System.Security.Claims.Claim> 
        { 
            new(System.Security.Claims.ClaimTypes.NameIdentifier, professorId.ToString()),
            new(System.Security.Claims.ClaimTypes.Role, "Professor")
        };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(claims)) }
        };

        // Act
        var result = await controller.GetStats();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var stats = Assert.IsType<DashboardStatsDto>(okResult.Value);

        Assert.Equal(1, stats.Stat1); // PendenteProfessor
        Assert.Equal(1, stats.Stat2); // Agendada week
        Assert.Equal(1, stats.Stat3); // ProntoValidar
    }

    [Fact]
    public async Task GetStats_ShouldReturnEncarregadoMetrics()
    {
        // Arrange
        var context = GetDatabaseContext();
        var paiId = 3;
        context.Utilizadores.Add(new Utilizador { Id = paiId, Nome = "Pai", Tipo = TipoUtilizador.Encarregado });
        context.Alunos.Add(new Aluno { Id = 10, Nome = "Filho", EncarregadoId = paiId });

        // Session for this parent's student
        var sessao = new Sessao { Id = 1, Estado = EstadoSessao.Agendada };
        context.Sessoes.Add(sessao);
        context.Participantes.Add(new Participante { SessaoId = 1, AlunoId = 10 });

        // Active Loan
        context.Emprestimos.Add(new Emprestimo { Id = 1, UtilizadorId = paiId, Estado = EstadoEmprestimo.Aprovado, ItemId = 1 });

        await context.SaveChangesAsync();

        var controller = new DashboardController(context);
        var claims = new List<System.Security.Claims.Claim> 
        { 
            new(System.Security.Claims.ClaimTypes.NameIdentifier, paiId.ToString()),
            new(System.Security.Claims.ClaimTypes.Role, "Encarregado")
        };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(claims)) }
        };

        // Act
        var result = await controller.GetStats();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var stats = Assert.IsType<DashboardStatsDto>(okResult.Value);

        Assert.Equal(1, stats.Stat2); // Agendada session for child
        Assert.Equal(1, stats.Stat4); // Active loan
    }
}
