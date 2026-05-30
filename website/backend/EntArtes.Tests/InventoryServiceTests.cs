using EntArtes.Core.Entities;
using EntArtes.Core.DTOs;
using EntArtes.Infrastructure.Data;
using EntArtes.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EntArtes.Tests;

public class InventoryServiceTests
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
    public async Task SubmitItemAsync_ShouldCreatePendingItem()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new InventoryService(context);
        var dto = new ItemSubmissionDto 
        { 
            Nome = "Costume", 
            Descricao = "Desc", 
            Categoria = "Figurino", 
            EstadoConservacao = "Novo" 
        };

        // Act
        var result = await service.SubmitItemAsync(1, dto);

        // Assert
        Assert.Equal(EstadoItem.Privado, result.Estado);
        Assert.True(result.Disponivel);
        Assert.Equal(1, await context.Itens.CountAsync());
    }

    [Fact]
    public async Task ApproveItemAsync_ShouldMakeItemAvailableWithFinalFee()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new InventoryService(context);
        var item = new Item { Id = 1, Nome = "Item", Estado = EstadoItem.Pendente, Disponivel = false };
        context.Itens.Add(item);
        await context.SaveChangesAsync();

        // Act
        await service.ApproveItemAsync(1, 15.50m);

        // Assert
        var approvedItem = await context.Itens.FindAsync(1);
        Assert.Equal(EstadoItem.Aprovado, approvedItem!.Estado);
        Assert.True(approvedItem.Disponivel);
        Assert.Equal(15.50m, approvedItem.TaxaSimbolica);
    }

    [Fact]
    public async Task BuyItemAsync_ShouldCreateSaleAndMakeItemUnavailable()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new InventoryService(context);
        
        var item = new Item 
        { 
            Id = 1, 
            Nome = "Sapatilhas", 
            Tipo = TipoItem.Venda, 
            Disponivel = true, 
            PrecoVenda = 25.00m,
            Estado = EstadoItem.Aprovado 
        };
        context.Itens.Add(item);
        await context.SaveChangesAsync();

        // Act
        await service.BuyItemAsync(1, 1);

        // Assert
        var sale = await context.Vendas.FirstOrDefaultAsync();
        Assert.NotNull(sale);
        Assert.Equal(1, sale.ItemId);
        Assert.Equal(1, sale.UtilizadorId);
        Assert.Equal(25.00m, sale.PrecoFinal);

        var updatedItem = await context.Itens.FindAsync(1);
        Assert.False(updatedItem!.Disponivel);
    }

    [Fact]
    public async Task BuyItemAsync_ShouldThrow_IfItemIsNotForSale()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new InventoryService(context);
        
        var item = new Item 
        { 
            Id = 1, 
            Nome = "Tutu", 
            Tipo = TipoItem.Aluguer, // Not for sale
            Disponivel = true, 
            Estado = EstadoItem.Aprovado 
        };
        context.Itens.Add(item);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => service.BuyItemAsync(1, 1));
    }

    [Fact]
    public async Task BuyItemAsync_ShouldThrow_IfItemIsUnavailable()
    {
        // Arrange
        var context = GetDatabaseContext();
        var service = new InventoryService(context);
        
        var item = new Item 
        { 
            Id = 1, 
            Nome = "Sapatilhas", 
            Tipo = TipoItem.Venda, 
            Disponivel = false, // Already sold or rented
            Estado = EstadoItem.Aprovado 
        };
        context.Itens.Add(item);
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => service.BuyItemAsync(1, 1));
    }
}
