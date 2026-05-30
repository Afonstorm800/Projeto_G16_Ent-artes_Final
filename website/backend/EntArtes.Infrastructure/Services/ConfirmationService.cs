using Microsoft.EntityFrameworkCore;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;
using EntArtes.Infrastructure.Data;

namespace EntArtes.Infrastructure.Services;

public class ConfirmationService : IConfirmationService
{
    private readonly AppDbContext _context;

    public ConfirmationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task ConfirmByEncAsync(int sessaoId)
    {
        try
        {
            Console.WriteLine($"[CONFIRM] Guardian confirming session {sessaoId}");
            var sessao = await _context.Sessoes
                .Include(s => s.Professor)
                .Include(s => s.Modalidade)
                .Include(s => s.Estudio)
                .FirstOrDefaultAsync(s => s.Id == sessaoId);

            if (sessao == null) throw new Exception($"Sessão {sessaoId} não encontrada");

            if (sessao.EncConfirmado) 
            {
                Console.WriteLine($"[CONFIRM] Session {sessaoId} already confirmed by EE. Skipping.");
                return;
            }

            if (sessao.Estado != EstadoSessao.Agendada && sessao.Estado != EstadoSessao.ProntoValidar) 
                throw new Exception($"A sessão {sessaoId} está em estado {sessao.Estado}, impossibilitando confirmação");

            sessao.EncConfirmado = true;
            await CheckAndSetProntoValidar(sessao);
            await _context.SaveChangesAsync();
            Console.WriteLine($"[CONFIRM] Session {sessaoId} EE confirmation SAVED. Current State: {sessao.Estado}");
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.Message ?? "N/A";
            Console.WriteLine($"[CONFIRM] ERROR EE: {ex.Message}");
            throw new Exception($"Erro ao confirmar EE: {ex.Message} | Inner: {inner}");
        }
    }

    public async Task ConfirmByProfAsync(int sessaoId)
    {
        try
        {
            Console.WriteLine($"[CONFIRM] Professor confirming session {sessaoId}");
            var sessao = await _context.Sessoes
                .Include(s => s.Professor)
                .Include(s => s.Modalidade)
                .Include(s => s.Estudio)
                .FirstOrDefaultAsync(s => s.Id == sessaoId);

            if (sessao == null) throw new Exception($"Sessão {sessaoId} não encontrada");

            if (sessao.ProfConfirmado) 
            {
                Console.WriteLine($"[CONFIRM] Session {sessaoId} already confirmed by Prof. Skipping.");
                return;
            }

            if (sessao.Estado != EstadoSessao.Agendada && sessao.Estado != EstadoSessao.ProntoValidar) 
                throw new Exception($"A sessão {sessaoId} está em estado {sessao.Estado}, impossibilitando confirmação");

            sessao.ProfConfirmado = true;
            await CheckAndSetProntoValidar(sessao);
            await _context.SaveChangesAsync();
            Console.WriteLine($"[CONFIRM] Session {sessaoId} Prof confirmation SAVED. Current State: {sessao.Estado}");
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.Message ?? "N/A";
            Console.WriteLine($"[CONFIRM] ERROR Prof: {ex.Message}");
            throw new Exception($"Erro ao confirmar Prof: {ex.Message} | Inner: {inner}");
        }
    }

    private async Task CheckAndSetProntoValidar(Sessao sessao)
    {
        if (sessao.EncConfirmado && sessao.ProfConfirmado)
        {
            sessao.Estado = EstadoSessao.ProntoValidar;
            // Notify Direção (in real implementation, send email or push notification)
        }
    }

    public async Task ValidateSessionAsync(int sessaoId)
    {
        var sessao = await _context.Sessoes.FindAsync(sessaoId);
        if (sessao == null) throw new Exception("Sessão não encontrada");
        
        // Final approval by direction moves session to Concluida
        // This can happen if state is ProntoValidar OR if Direcao force-validates an Agendada session
        if (sessao.Estado != EstadoSessao.ProntoValidar && sessao.Estado != EstadoSessao.Agendada) 
            throw new Exception("Sessão não está em estado para validação final");

        sessao.Estado = EstadoSessao.Concluida;
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Sessao>> GetSessionsReadyForValidationAsync()
    {
        return await _context.Sessoes
            .Where(s => s.Estado == EstadoSessao.ProntoValidar && s.Participantes.Any())
            .Include(s => s.Estudio)
            .Include(s => s.Professor)
            .Include(s => s.Modalidade)
            .Include(s => s.Participantes).ThenInclude(p => p.Aluno)
            .ToListAsync();
    }

    public async Task<IEnumerable<Sessao>> GetSessionsForConfirmationAsync(int userId, string role)
    {
        // 1. Initial query: filter out empty sessions (no participants)
        var query = _context.Sessoes
            .Where(s => s.Participantes.Any())
            .Include(s => s.Professor)
            .Include(s => s.Modalidade)
            .Include(s => s.Participantes).ThenInclude(p => p.Aluno)
            .AsQueryable();

        // 2. State filtering: sessions in the 48h cycle are Agendada or ProntoValidar
        query = query.Where(s => s.Estado == EstadoSessao.Agendada || s.Estado == EstadoSessao.ProntoValidar);

        // 3. Role filtering
        var normalizedRole = role.ToLower().Trim();

        if (normalizedRole == "professor")
        {
            // Professor sees all sessions assigned to them in the 48h cycle
            query = query.Where(s => s.ProfessorId == userId);
        }
        else if (normalizedRole == "encarregado")
        {
            // Encarregado sees all sessions with their students in the 48h cycle
            query = query.Where(s => s.Participantes.Any(p => p.Aluno.EncarregadoId == userId));
        }
        else if (normalizedRole == "direcao")
        {
            // Direcao sees everything in the 48h cycle, confirmed or not
            // No extra filter
        }

        return await query.OrderByDescending(s => s.DataHoraInicio).ToListAsync();
    }
}