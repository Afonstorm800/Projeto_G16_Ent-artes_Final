using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;

namespace EntArtes.Core.Interfaces;

public interface IInventoryService
{
	Task<Item> SubmitItemAsync(int contribuidorId, ItemSubmissionDto dto);
	Task<Item?> GetItemByIdAsync(int id);
	Task ApproveItemAsync(int itemId, decimal? taxa = null, decimal? precoVenda = null);
	Task RejectItemAsync(int itemId);
	Task<IEnumerable<Item>> GetPendingItemsAsync();
    
    // Personal Inventory
	Task<IEnumerable<Item>> GetUserInventoryAsync(int userId);
    Task UpdateItemAsync(int userId, int itemId, ItemSubmissionDto dto);
    Task DeleteItemAsync(int userId, int itemId);
    Task SubmitToMarketplaceAsync(int userId, int itemId);

    // Marketplace
    Task<IEnumerable<Item>> GetAvailableItemsAsync();
    Task<IEnumerable<CatalogoItem>> GetCatalogAsync();
    
    // Sales
    Task BuyItemAsync(int utilizadorId, int itemId);
    Task<IEnumerable<Venda>> GetAllSalesAsync();
    Task<IEnumerable<Venda>> GetMySalesAsync(int utilizadorId);
}