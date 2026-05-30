using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;

namespace EntArtes.Core.Interfaces;

public interface ILoanService
{
    Task<Emprestimo> RequestLoanAsync(int utilizadorId, LoanRequestDto dto);
    Task<IEnumerable<Emprestimo>> GetPendingLoansAsync();
    Task<Emprestimo?> GetLoanByIdAsync(int id);
    Task ApproveLoanAsync(int loanId, decimal taxa);
    Task RejectLoanAsync(int loanId);
    Task ReturnLoanAsync(int loanId); // Pela Direção
    Task ConfirmReturnAsync(int loanId); // Pelo Pai
    Task<IEnumerable<Emprestimo>> GetAllLoansAsync();    Task<IEnumerable<Emprestimo>> GetActiveLoansForUserAsync(int utilizadorId);}
