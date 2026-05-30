using Microsoft.EntityFrameworkCore;
using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;
using EntArtes.Infrastructure.Data;

namespace EntArtes.Infrastructure.Services;

public class LoanService : ILoanService
{
    private readonly AppDbContext _context;

    public LoanService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Emprestimo> RequestLoanAsync(int utilizadorId, LoanRequestDto dto)
    {
        var item = await _context.Itens.FindAsync(dto.ItemId);
        if (item == null) throw new Exception("Item not found");
        if (!item.Disponivel || item.Estado != EstadoItem.Aprovado) throw new Exception("Item not available");

        var loan = new Emprestimo
        {
            DataInicio = DateTime.MinValue, // not set until approval
            DataFimPrevisto = dto.DataFimPrevisto,
            DataDevolucao = null,
            DataPedido = DateTime.Now,
            Estado = EstadoEmprestimo.Pendente,
            TaxaAplicada = 0,
            ItemId = dto.ItemId,
            UtilizadorId = utilizadorId
        };
        _context.Emprestimos.Add(loan);
        await _context.SaveChangesAsync();
        // TODO: notify Direção
        return loan;
    }

    public async Task<IEnumerable<Emprestimo>> GetPendingLoansAsync()
    {
        return await _context.Emprestimos
            .Where(l => l.Estado == EstadoEmprestimo.Pendente)
            .Include(l => l.Item)
                .ThenInclude(i => i.Contribuidor)
            .Include(l => l.Utilizador)
            .ToListAsync();
    }

    public async Task<Emprestimo?> GetLoanByIdAsync(int id) => await _context.Emprestimos.FindAsync(id);

    public async Task ApproveLoanAsync(int loanId, decimal taxa)
    {
        var loan = await _context.Emprestimos.FindAsync(loanId);
        if (loan == null) throw new Exception("Loan not found");
        if (loan.Estado != EstadoEmprestimo.Pendente) throw new Exception("Loan already processed");
        loan.Estado = EstadoEmprestimo.Aprovado;
        loan.TaxaAplicada = taxa;
        loan.DataInicio = DateTime.Today;
        var item = await _context.Itens.FindAsync(loan.ItemId);
        if (item != null) item.Disponivel = false;
        await _context.SaveChangesAsync();
        // TODO: notify user
    }

    public async Task RejectLoanAsync(int loanId)
    {
        var loan = await _context.Emprestimos.FindAsync(loanId);
        if (loan == null) throw new Exception("Loan not found");
        loan.Estado = EstadoEmprestimo.Rejeitado;
        await _context.SaveChangesAsync();
        // TODO: notify user
    }

    public async Task ReturnLoanAsync(int loanId)
    {
        var loan = await _context.Emprestimos.FindAsync(loanId);
        if (loan == null) throw new Exception("Loan not found");
        if (loan.Estado != EstadoEmprestimo.Aprovado) throw new Exception("Loan not approved");
        
        loan.Estado = EstadoEmprestimo.DevolvidoPelaDirecao;
        loan.DataDevolucao = DateTime.Today;

        var item = await _context.Itens.FindAsync(loan.ItemId);
        if (item != null) item.Disponivel = true;
        
        await _context.SaveChangesAsync();
    }

    public async Task ConfirmReturnAsync(int loanId)
    {
        // This method can be kept for compatibility but it's redundant now
        await ReturnLoanAsync(loanId);
    }

    public async Task<IEnumerable<Emprestimo>> GetAllLoansAsync()
    {
        return await _context.Emprestimos
            .Include(l => l.Item)
                .ThenInclude(i => i.Contribuidor)
            .Include(l => l.Utilizador)
            .OrderByDescending(l => l.Id)
            .ToListAsync();
    }

    public async Task<IEnumerable<Emprestimo>> GetActiveLoansForUserAsync(int utilizadorId)
    {
        return await _context.Emprestimos
            .Where(l => l.UtilizadorId == utilizadorId)
            .Include(l => l.Item)
                .ThenInclude(i => i.Contribuidor)
            .Include(l => l.Utilizador) // Incluir o utilizador para ter o nome
            .OrderByDescending(l => l.Id)
            .ToListAsync();
    }
}