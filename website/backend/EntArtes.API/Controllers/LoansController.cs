using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EntArtes.Core.DTOs;
using EntArtes.Core.Interfaces;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loan;

    public LoansController(ILoanService loan)
    {
        _loan = loan;
    }

    [HttpGet]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetAllLoans()
    {
        var loans = await _loan.GetAllLoansAsync();
        return Ok(loans);
    }

    [HttpPost("requests")]
    public async Task<IActionResult> RequestLoan(LoanRequestDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var loan = await _loan.RequestLoanAsync(userId, dto);
        return Ok(loan);
    }

    [HttpGet("requests/pending")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetPendingLoans()
    {
        var loans = await _loan.GetPendingLoansAsync();
        return Ok(loans);
    }

    [HttpPost("requests/{id}/approve")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ApproveLoan(int id, ApproveLoanDto dto)
    {
        await _loan.ApproveLoanAsync(id, dto.TaxaAplicada);
        return Ok();
    }

    [HttpPost("requests/{id}/reject")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> RejectLoan(int id)
    {
        await _loan.RejectLoanAsync(id);
        return Ok();
    }

    [HttpPost("{id}/return")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ReturnLoan(int id)
    {
        await _loan.ReturnLoanAsync(id);
        return Ok();
    }

    [HttpPost("{id}/confirm-return")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ConfirmReturn(int id)
    {
        await _loan.ConfirmReturnAsync(id);
        return Ok();
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyLoans()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var loans = await _loan.GetActiveLoansForUserAsync(userId);
        return Ok(loans);
    }
}