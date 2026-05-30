using EntArtes.Core.Entities;

namespace EntArtes.Core.Interfaces;

public interface IBillingService
{
    Task ProcessMonthlyBillingAsync(int ano, int mes);
    Task ProcessSingleUserBillingAsync(int ano, int mes, int encarregadoId);
    Task<byte[]> GenerateExcelForFaturaAsync(int faturaId);
}