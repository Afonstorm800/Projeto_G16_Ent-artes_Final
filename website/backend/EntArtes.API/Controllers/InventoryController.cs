using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EntArtes.Core.DTOs;
using EntArtes.Core.Interfaces;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventory;

    public InventoryController(IInventoryService inventory)
    {
        _inventory = inventory;
    }

    [HttpPost("items")]
    public async Task<IActionResult> SubmitItem(ItemSubmissionDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var item = await _inventory.SubmitItemAsync(userId, dto);
        return Ok(item);
    }

    [HttpGet("items/available")]
    public async Task<IActionResult> GetAvailableItems()
    {
        var items = await _inventory.GetAvailableItemsAsync();
        return Ok(items);
    }

    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog()
    {
        var catalog = await _inventory.GetCatalogAsync();
        return Ok(catalog);
    }

    [HttpGet("items/pending")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetPendingItems()
    {
        var items = await _inventory.GetPendingItemsAsync();
        return Ok(items);
    }

    [HttpPost("items/{id}/approve")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ApproveItem(int id, [FromQuery] decimal? taxa = null, [FromQuery] decimal? precoVenda = null)
    {
        await _inventory.ApproveItemAsync(id, taxa, precoVenda);
        return Ok();
    }

    [HttpPost("items/{id}/reject")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> RejectItem(int id)
    {
        await _inventory.RejectItemAsync(id);
        return Ok();
    }

    [HttpPost("items/{id}/buy")]
    public async Task<IActionResult> BuyItem(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _inventory.BuyItemAsync(userId, id);
        return Ok();
    }

    [HttpGet("items/my")]
    public async Task<IActionResult> GetMyInventory()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var items = await _inventory.GetUserInventoryAsync(userId);
        return Ok(items);
    }

    [HttpPut("items/{id}")]
    public async Task<IActionResult> UpdateItem(int id, ItemSubmissionDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _inventory.UpdateItemAsync(userId, id, dto);
        return Ok();
    }

    [HttpDelete("items/{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _inventory.DeleteItemAsync(userId, id);
        return Ok();
    }

    [HttpPost("items/{id}/submit-marketplace")]
    public async Task<IActionResult> SubmitToMarketplace(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _inventory.SubmitToMarketplaceAsync(userId, id);
        return Ok();
    }

    [HttpGet("sales")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetAllSales()
    {
        var sales = await _inventory.GetAllSalesAsync();
        return Ok(sales);
    }

    [HttpGet("sales/my")]
    public async Task<IActionResult> GetMySales()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var sales = await _inventory.GetMySalesAsync(userId);
        return Ok(sales);
    }
}