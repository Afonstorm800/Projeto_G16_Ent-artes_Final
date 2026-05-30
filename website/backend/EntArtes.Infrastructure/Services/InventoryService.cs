using Microsoft.EntityFrameworkCore;
using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;
using EntArtes.Infrastructure.Data;

namespace EntArtes.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _context;

    public InventoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Item> SubmitItemAsync(int contribuidorId, ItemSubmissionDto dto)
    {
        // Add to catalog if not exists
        var inCatalog = await _context.CatalogoItens.AnyAsync(c => c.Nome == dto.Nome && c.Genero == dto.Genero);
        if (!inCatalog)
        {
            _context.CatalogoItens.Add(new CatalogoItem 
            { 
                Nome = dto.Nome, 
                Categoria = dto.Categoria, 
                Genero = dto.Genero 
            });
        }

        // We now always create a new record for personal tracking, starting as Privado
        var item = new Item
        {
            Nome = dto.Nome,
            Descricao = dto.Descricao,
            Categoria = dto.Categoria,
            Genero = dto.Genero,
            Tamanho = dto.Tamanho,
            EstadoConservacao = dto.EstadoConservacao,
            FotoUrl = dto.FotoUrl,
            Disponivel = true,
            TaxaSimbolica = dto.TaxaSimbolica,
            PrecoVenda = dto.PrecoVenda,
            Tipo = dto.Tipo,
            Estado = EstadoItem.Privado, // Starts private
            Quantidade = 1,
            DataSubmissao = DateTime.Now,
            ContribuidorId = contribuidorId
        };
        _context.Itens.Add(item);
        await _context.SaveChangesAsync();
        return item;
    }

    public async Task<IEnumerable<Item>> GetUserInventoryAsync(int userId)
    {
        return await _context.Itens
            .Where(i => i.ContribuidorId == userId)
            .Include(i => i.Venda)
            .Include(i => i.Emprestimos.Where(l => l.Estado == EstadoEmprestimo.Aprovado))
                .ThenInclude(l => l.Utilizador)
            .OrderByDescending(i => i.DataSubmissao)
            .ToListAsync();
    }

    public async Task UpdateItemAsync(int userId, int itemId, ItemSubmissionDto dto)
    {
        var item = await _context.Itens.FindAsync(itemId);
        if (item == null || item.ContribuidorId != userId) throw new Exception("Item não encontrado");
        
        // Cannot edit if on loan
        var hasActiveLoan = await _context.Emprestimos.AnyAsync(l => l.ItemId == itemId && l.Estado == EstadoEmprestimo.Aprovado);
        if (hasActiveLoan) throw new Exception("Não é possível editar um item que está atualmente emprestado");

        item.Nome = dto.Nome;
        item.Descricao = dto.Descricao;
        item.Categoria = dto.Categoria;
        item.Genero = dto.Genero;
        item.Tamanho = dto.Tamanho;
        item.EstadoConservacao = dto.EstadoConservacao;
        item.FotoUrl = dto.FotoUrl;
        item.TaxaSimbolica = dto.TaxaSimbolica;
        item.PrecoVenda = dto.PrecoVenda;
        item.Tipo = dto.Tipo;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteItemAsync(int userId, int itemId)
    {
        var item = await _context.Itens.FindAsync(itemId);
        if (item == null || item.ContribuidorId != userId) throw new Exception("Item não encontrado");

        var hasActiveLoan = await _context.Emprestimos.AnyAsync(l => l.ItemId == itemId && l.Estado == EstadoEmprestimo.Aprovado);
        if (hasActiveLoan) throw new Exception("Não é possível remover um item que está atualmente emprestado");

        _context.Itens.Remove(item);
        await _context.SaveChangesAsync();
    }

    public async Task SubmitToMarketplaceAsync(int userId, int itemId)
    {
        var item = await _context.Itens.FindAsync(itemId);
        if (item == null || item.ContribuidorId != userId) throw new Exception("Item não encontrado");
        if (item.Estado != EstadoItem.Privado && item.Estado != EstadoItem.Rejeitado)
            throw new Exception("Item já está no marketplace");

        item.Estado = EstadoItem.Aprovado;
        item.Disponivel = true;
        await _context.SaveChangesAsync();
    }
    public async Task<IEnumerable<CatalogoItem>> GetCatalogAsync()
    {
        return await _context.CatalogoItens.ToListAsync();
    }

    public async Task<Item?> GetItemByIdAsync(int id) => await _context.Itens.FindAsync(id);

    public async Task ApproveItemAsync(int itemId, decimal? taxa = null, decimal? precoVenda = null)
    {
        var item = await _context.Itens.FindAsync(itemId);
        if (item == null) throw new Exception("Item not found");
        if (item.Estado != EstadoItem.Pendente) throw new Exception("Item already processed");
        
        item.Estado = EstadoItem.Aprovado;
        if (taxa.HasValue) item.TaxaSimbolica = taxa.Value;
        if (precoVenda.HasValue) item.PrecoVenda = precoVenda.Value;
        
        item.Disponivel = true;
        await _context.SaveChangesAsync();
    }

    public async Task RejectItemAsync(int itemId)
    {
        var item = await _context.Itens.FindAsync(itemId);
        if (item == null) throw new Exception("Item not found");
        item.Estado = EstadoItem.Rejeitado;
        item.Disponivel = false;
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Item>> GetPendingItemsAsync()
    {
        return await _context.Itens
            .Where(i => i.Estado == EstadoItem.Pendente)
            .Include(i => i.Contribuidor)
            .ToListAsync();
    }

    public async Task<IEnumerable<Item>> GetAvailableItemsAsync()
    {
        return await _context.Itens
            .Where(i => i.Estado == EstadoItem.Aprovado && i.Disponivel)
            .Include(i => i.Contribuidor)
            .ToListAsync();
    }

    public async Task BuyItemAsync(int utilizadorId, int itemId)
    {
        var item = await _context.Itens.FindAsync(itemId);
        if (item == null) throw new Exception("Item not found");
        if (!item.Disponivel || item.Tipo != TipoItem.Venda) throw new Exception("Item not available for sale");

        var venda = new Venda
        {
            DataVenda = DateTime.Now,
            PrecoFinal = item.PrecoVenda ?? 0,
            ItemId = itemId,
            UtilizadorId = utilizadorId
        };

        item.Disponivel = false;
        _context.Vendas.Add(venda);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Venda>> GetAllSalesAsync()
    {
        return await _context.Vendas
            .Include(v => v.Item)
                .ThenInclude(i => i.Contribuidor)
            .Include(v => v.Comprador)
            .OrderByDescending(v => v.DataVenda)
            .ToListAsync();
    }

    public async Task<IEnumerable<Venda>> GetMySalesAsync(int utilizadorId)
    {
        return await _context.Vendas
            .Where(v => v.UtilizadorId == utilizadorId)
            .Include(v => v.Item)
                .ThenInclude(i => i.Contribuidor)
            .OrderByDescending(v => v.DataVenda)
            .ToListAsync();
    }
}