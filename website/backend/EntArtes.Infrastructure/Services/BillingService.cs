using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;
using EntArtes.Infrastructure.Data;

namespace EntArtes.Infrastructure.Services;

public class BillingService : IBillingService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService; // to be implemented later

    public BillingService(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task ProcessMonthlyBillingAsync(int ano, int mes)
    {
        if (ano < 2000 || mes < 1 || mes > 12)
            throw new Exception($"Data inválida para faturação: {mes}/{ano}");

        // Get all concluded sessions from given month that are not yet billed
        var startDate = new DateTime(ano, mes, 1);
        var endDate = startDate.AddMonths(1);
        var sessions = await _context.Sessoes
            .Where(s => s.Estado == EstadoSessao.Concluida && s.FaturaId == null &&
                        s.DataHoraInicio >= startDate && s.DataHoraInicio < endDate)
            .Include(s => s.Participantes)
                .ThenInclude(p => p.Aluno)
            .Include(s => s.Professor)
            .ToListAsync();

        // Group by encarregado (through participantes)
        var groups = sessions
            .SelectMany(s => s.Participantes.Select(p => new { Session = s, Aluno = p.Aluno }))
            .GroupBy(x => x.Aluno.EncarregadoId)
            .ToList();

        foreach (var group in groups)
        {
            await CreateFaturaForGroupAsync(ano, mes, group.Key, group.Select(x => x.Session).ToList());
        }
    }

    public async Task ProcessSingleUserBillingAsync(int ano, int mes, int encarregadoId)
    {
        Console.WriteLine($"[BILLING] Requesting individual billing for User {encarregadoId} at {mes}/{ano}");
        
        if (ano < 2000 || mes < 1 || mes > 12)
            throw new Exception($"Data inválida para faturação individual: {mes}/{ano}. Por favor, recarregue a página.");

        // For individual billing, we might want to pick up all pending sessions regardless of the month,
        // or at least be more flexible. For now, let's stick to the requested month but throw an error if empty.
        var startDate = new DateTime(ano, mes, 1);
        var endDate = startDate.AddMonths(1);
        
        var sessions = await _context.Sessoes
            .Where(s => s.Estado == EstadoSessao.Concluida && s.FaturaId == null &&
                        s.DataHoraInicio >= startDate && s.DataHoraInicio < endDate &&
                        s.Participantes.Any(p => p.Aluno.EncarregadoId == encarregadoId))
            .Include(s => s.Participantes)
                .ThenInclude(p => p.Aluno)
            .Include(s => s.Professor)
            .ToListAsync();

        if (!sessions.Any()) 
            throw new Exception($"Não foram encontradas sessões pendentes para este encarregado no mês {mes}/{ano}.");

        await CreateFaturaForGroupAsync(ano, mes, encarregadoId, sessions);
    }

    private async Task CreateFaturaForGroupAsync(int ano, int mes, int encarregadoId, List<Sessao> sessions)
    {
        var encarregado = await _context.Utilizadores.FindAsync(encarregadoId);
        if (encarregado == null) return;

        double totalHoras = sessions.Sum(s => (s.DataHoraFim - s.DataHoraInicio).TotalHours);
        decimal valorTotal = sessions.Sum(s => s.Preco);
        
        var fatura = new Fatura
        {
            Mes = mes,
            Ano = ano,
            DataEmissao = DateTime.Today,
            TotalHoras = totalHoras,
            ValorTotal = valorTotal,
            UtilizadorId = encarregadoId,
            Paga = false
        };
        _context.Faturas.Add(fatura);
        await _context.SaveChangesAsync();

        // Assign sessions to this fatura
        foreach (var s in sessions)
        {
            s.FaturaId = fatura.Id;
        }
        await _context.SaveChangesAsync();

        try 
        {
            // Generate Excel file
            var excelBytes = await GenerateExcelForFaturaAsync(fatura.Id);
            
            // Save to disk
            var folderPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Invoices");
            if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);
            
            var fileName = $"Fatura_{fatura.Id}_{encarregado.Email}.xlsx";
            var filePath = Path.Combine(folderPath, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, excelBytes);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao gerar/guardar ficheiro Excel: {ex.Message}");
        }
    }

    public async Task<byte[]> GenerateExcelForFaturaAsync(int faturaId)
    {
        var fatura = await _context.Faturas
            .Include(f => f.Utilizador)
            .Include(f => f.Sessoes)
                .ThenInclude(s => s.Modalidade)
            .Include(f => f.Sessoes)
                .ThenInclude(s => s.Professor)
            .Include(f => f.Sessoes)
                .ThenInclude(s => s.Participantes)
                    .ThenInclude(p => p.Aluno)
            .FirstOrDefaultAsync(f => f.Id == faturaId);

        if (fatura == null) throw new Exception("Fatura não encontrada no sistema.");

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add($"Fatura {fatura.Mes}-{fatura.Ano}");

        // Cabeçalhos atualizados: Data, Horário, Modalidade, Formato, Professor, Alunos
        worksheet.Cells[1, 1].Value = "Data";
        worksheet.Cells[1, 2].Value = "Horário";
        worksheet.Cells[1, 3].Value = "Modalidade";
        worksheet.Cells[1, 4].Value = "Formato";
        worksheet.Cells[1, 5].Value = "Professor";
        worksheet.Cells[1, 6].Value = "Alunos";
        
        using (var range = worksheet.Cells[1, 1, 1, 6])
        {
            range.Style.Font.Bold = true;
            range.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
        }

        int row = 2;
        foreach (var sessao in fatura.Sessoes.OrderBy(s => s.DataHoraInicio))
        {
            worksheet.Cells[row, 1].Value = sessao.DataHoraInicio.ToString("dd/MM/yyyy");
            worksheet.Cells[row, 2].Value = $"{sessao.DataHoraInicio:HH:mm} - {sessao.DataHoraFim:HH:mm}";
            worksheet.Cells[row, 3].Value = sessao.Modalidade?.Nome ?? "N/A";
            worksheet.Cells[row, 4].Value = sessao.Formato.ToString();
            worksheet.Cells[row, 5].Value = sessao.Professor?.Nome ?? "N/A";
            
            var alunos = sessao.Participantes != null 
                ? string.Join(", ", sessao.Participantes.Select(p => p.Aluno?.Nome ?? "N/A"))
                : "N/A";
                
            worksheet.Cells[row, 6].Value = alunos;
            row++;
        }

        // Rodapé de Total (Horas totais)
        row++; // Espaço extra
        double totalMinutos = fatura.Sessoes.Sum(s => (s.DataHoraFim - s.DataHoraInicio).TotalMinutes);
        double totalHoras = totalMinutos / 60.0;

        worksheet.Cells[row, 5].Value = "TOTAL DE HORAS:";
        worksheet.Cells[row, 5].Style.Font.Bold = true;
        worksheet.Cells[row, 6].Value = $"{totalHoras:N1} h";
        worksheet.Cells[row, 6].Style.Font.Bold = true;
        worksheet.Cells[row, 6].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Right;

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        
        return await package.GetAsByteArrayAsync();
    }
}