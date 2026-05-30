using EntArtes.Core.Entities;
using EntArtes.Infrastructure.Data;
using EntArtes.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EntArtes.Tests;

public class LoanServiceTests
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
    public async Task ReturnLoanAsync_ShouldUpdateStatusAndMakeItemAvailable()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new LoanService(context);
        
        var item = new Item { Id = 1, Nome = "Test Item", Disponivel = false, Estado = EstadoItem.Aprovado };
        var loan = new Emprestimo { Id = 1, ItemId = 1, Estado = EstadoEmprestimo.Aprovado, UtilizadorId = 1 };
        
        context.Itens.Add(item);
        context.Emprestimos.Add(loan);
        await context.SaveChangesAsync();

        // Act
        await service.ReturnLoanAsync(1);

        // Assert
        var updatedLoan = await context.Emprestimos.FindAsync(1);
        var updatedItem = await context.Itens.FindAsync(1);

        Assert.Equal(EstadoEmprestimo.DevolvidoPelaDirecao, updatedLoan!.Estado);
        Assert.NotNull(updatedLoan.DataDevolucao);
        Assert.True(updatedItem!.Disponivel);
    }

    [Fact]
    public async Task ReturnLoanAsync_ShouldThrowException_IfLoanNotApproved()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new LoanService(context);
        
        var loan = new Emprestimo { Id = 1, Estado = EstadoEmprestimo.Pendente, ItemId = 1 };
        context.Emprestimos.Add(loan);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => service.ReturnLoanAsync(1));
    }

    [Fact]
    public async Task RequestLoanAsync_ShouldThrowException_IfItemNotAvailable()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new LoanService(context);
        
        var item = new Item { Id = 1, Nome = "Busy Item", Disponivel = false, Estado = EstadoItem.Aprovado };
        context.Itens.Add(item);
        await context.SaveChangesAsync();

        var request = new Core.DTOs.LoanRequestDto { ItemId = 1, DataFimPrevisto = DateTime.Now.AddDays(7) };

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => service.RequestLoanAsync(1, request));
    }
}
