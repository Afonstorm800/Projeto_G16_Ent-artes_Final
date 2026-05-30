using EntArtes.Core.Entities;
using EntArtes.Core.DTOs;
using EntArtes.Infrastructure.Data;
using EntArtes.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EntArtes.Tests;

public class SchedulingServiceTests
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

    private async Task SeedBaseData(AppDbContext context)
    {
        var modalidade = new Modalidade { Id = 1, Nome = "Dança Contemporânea" };
        var studio = new Estudio { Id = 1, Nome = "Estúdio A" };
        var professor = new Utilizador 
        { 
            Id = 2, 
            Nome = "Professor Ana", 
            Tipo = TipoUtilizador.Professor,
            Email = "ana@test.com"
        };

        context.Modalidades.Add(modalidade);
        context.Estudios.Add(studio);
        context.Utilizadores.Add(professor);
        
        context.EstudioModalidades.Add(new EstudioModalidade { EstudioId = 1, ModalidadeId = 1 });
        context.ProfessorModalidades.Add(new ProfessorModalidade { ProfessorId = 2, ModalidadeId = 1 });
        
        // Availability: Monday 09:00 - 12:00
        context.DisponibilidadesProfessores.Add(new DisponibilidadeProfessor 
        { 
            ProfessorId = 2, 
            DiaSemana = (int)DayOfWeek.Monday, 
            HoraInicio = new TimeSpan(9, 0, 0), 
            HoraFim = new TimeSpan(12, 0, 0) 
        });

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldReturnSlots_WhenProfessorAndStudioAreFree()
    {
        // Arrange
        var context = GetDatabaseContext();
        await SeedBaseData(context);
        var service = new SchedulingService(context);
        
        // Find next Monday
        DateTime nextMonday = DateTime.Now.Date;
        while (nextMonday.DayOfWeek != DayOfWeek.Monday) nextMonday = nextMonday.AddDays(1);

        // Act
        var slots = await service.GetAvailableSlotsAsync(nextMonday, 1, FormatoAula.Individual);

        // Assert
        Assert.NotEmpty(slots);
        Assert.Contains(slots, s => s.StartTime.TimeOfDay == new TimeSpan(9, 0, 0));
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldNotReturnSlots_WhenProfessorIsOccupied()
    {
        // Arrange
        var context = GetDatabaseContext();
        await SeedBaseData(context);
        var service = new SchedulingService(context);
        
        DateTime nextMonday = DateTime.Now.Date;
        while (nextMonday.DayOfWeek != DayOfWeek.Monday) nextMonday = nextMonday.AddDays(1);

        // Add a session that occupies the 09:00-10:00 slot
        context.Sessoes.Add(new Sessao 
        { 
            ProfessorId = 2, 
            EstudioId = 1, 
            ModalidadeId = 1,
            DataHoraInicio = nextMonday.AddHours(9),
            DataHoraFim = nextMonday.AddHours(10),
            Estado = EstadoSessao.Agendada
        });
        await context.SaveChangesAsync();

        // Act
        var slots = await service.GetAvailableSlotsAsync(nextMonday, 1, FormatoAula.Individual);

        // Assert
        // The 09:00 slot should be gone
        Assert.DoesNotContain(slots, s => s.StartTime == nextMonday.AddHours(9));
        // The 10:00 slot should still be available
        Assert.Contains(slots, s => s.StartTime == nextMonday.AddHours(10));
    }

    [Fact]
    public async Task CreateBookingRequestAsync_ShouldCreateSessionInPendingProfessorState()
    {
        // Arrange
        var context = GetDatabaseContext();
        await SeedBaseData(context);
        var service = new SchedulingService(context);
        
        var dto = new BookingRequestDto
        {
            ProfessorId = 2,
            EstudioId = 1,
            ModalidadeId = 1,
            DataHoraInicio = DateTime.Now.AddDays(1),
            DataHoraFim = DateTime.Now.AddDays(1).AddHours(1),
            Formato = FormatoAula.Individual,
            AlunosIds = new List<int> { 1 }
        };

        // Act
        var result = await service.CreateBookingRequestAsync(10, dto);

        // Assert
        Assert.Equal(EstadoSessao.PendenteProfessor, result.Estado);
        Assert.Equal(2, result.ProfessorId);
        Assert.Equal(1, result.EstudioId);
    }

    [Fact]
    public async Task ProfessorAcceptBookingAsync_ShouldChangeStateToPendingDirecao()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new SchedulingService(context);
        var sessao = new Sessao 
        { 
            Id = 1, 
            Estado = EstadoSessao.PendenteProfessor,
            DataHoraInicio = DateTime.Now,
            DataHoraFim = DateTime.Now.AddHours(1)
        };
        context.Sessoes.Add(sessao);
        await context.SaveChangesAsync();

        // Act
        await service.ProfessorAcceptBookingAsync(1);

        // Assert
        var updated = await context.Sessoes.FindAsync(1);
        Assert.Equal(EstadoSessao.PendenteDirecao, updated!.Estado);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldOnlyReturnCompatibleStudios()
    {
        // Arrange
        var context = GetDatabaseContext();
        await SeedBaseData(context);
        var service = new SchedulingService(context);

        // Add an incompatible studio (Studio B - ID 2)
        var studioB = new Estudio { Id = 2, Nome = "Estúdio B" };
        context.Estudios.Add(studioB);
        // Note: No EstudioModalidade entry for Studio B and Modality 1
        await context.SaveChangesAsync();

        DateTime nextMonday = DateTime.Now.Date;
        while (nextMonday.DayOfWeek != DayOfWeek.Monday) nextMonday = nextMonday.AddDays(1);

        // Act
        var slots = await service.GetAvailableSlotsAsync(nextMonday, 1, FormatoAula.Individual);

        // Assert
        Assert.All(slots, s => Assert.Equal(1, s.EstudioId)); // Only Studio A (ID 1) should be present
        Assert.DoesNotContain(slots, s => s.EstudioId == 2);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldNotReturnSlots_WhenStudioIsOccupiedByAnotherProfessor()
    {
        // Arrange
        var context = GetDatabaseContext();
        await SeedBaseData(context);
        var service = new SchedulingService(context);

        // Create another professor
        var professor2 = new Utilizador { Id = 3, Nome = "Prof 2", Tipo = TipoUtilizador.Professor, Email = "p2@test.com" };
        context.Utilizadores.Add(professor2);
        
        DateTime nextMonday = DateTime.Now.Date;
        while (nextMonday.DayOfWeek != DayOfWeek.Monday) nextMonday = nextMonday.AddDays(1);

        // Occupy Studio 1 with Professor 2 at 09:00
        context.Sessoes.Add(new Sessao 
        { 
            ProfessorId = 3, 
            EstudioId = 1, 
            ModalidadeId = 1,
            DataHoraInicio = nextMonday.AddHours(9),
            DataHoraFim = nextMonday.AddHours(10),
            Estado = EstadoSessao.Agendada
        });
        await context.SaveChangesAsync();

        // Act - Request slots for Professor 1 (ID 2)
        var slots = await service.GetAvailableSlotsAsync(nextMonday, 1, FormatoAula.Individual, professorId: 2);

        // Assert
        Assert.DoesNotContain(slots, s => s.StartTime == nextMonday.AddHours(9));
    }

    [Fact]
    public async Task ProfessorAcceptBookingAsync_ShouldThrow_IfSessionNotFound()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new SchedulingService(context);

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => service.ProfessorAcceptBookingAsync(999));
    }

    [Fact]
    public async Task ProfessorAcceptBookingAsync_ShouldThrow_IfInvalidState()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new SchedulingService(context);
        var sessao = new Sessao { Id = 1, Estado = EstadoSessao.Agendada }; // Already scheduled
        context.Sessoes.Add(sessao);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => service.ProfessorAcceptBookingAsync(1));
    }

    [Fact]
    public async Task ApproveBookingAsync_ShouldSetStatusToAgendada()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new SchedulingService(context);
        var sessao = new Sessao 
        { 
            Id = 1, 
            Estado = EstadoSessao.PendenteDirecao,
            DataHoraInicio = DateTime.Now,
            DataHoraFim = DateTime.Now.AddHours(1)
        };
        context.Sessoes.Add(sessao);
        await context.SaveChangesAsync();

        // Act
        await service.ApproveBookingAsync(1);

        // Assert
        var updated = await context.Sessoes.FindAsync(1);
        Assert.Equal(EstadoSessao.Agendada, updated!.Estado);
    }
}
