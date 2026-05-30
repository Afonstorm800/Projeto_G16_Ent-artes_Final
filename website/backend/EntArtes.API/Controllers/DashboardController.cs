using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EntArtes.Infrastructure.Data;
using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using System.Security.Claims;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        var userId = int.Parse(userIdStr);

        var userRoleStr = User.FindFirst(ClaimTypes.Role)?.Value;
        if (!Enum.TryParse<TipoUtilizador>(userRoleStr, out var role))
        {
            // Fallback: check db if role claim is missing or differently named
            var dbUser = await _context.Utilizadores.FindAsync(userId);
            if (dbUser == null) return Unauthorized();
            role = dbUser.Tipo;
        }

        var stats = new DashboardStatsDto();

        if (role == TipoUtilizador.Direcao)
        {
            // Direcao:
            // 1. Pedidos a aprovar (Items and Loans)
            stats.Stat1 = await _context.Itens.CountAsync(i => i.Estado == EstadoItem.Pendente) +
                         await _context.Emprestimos.CountAsync(l => l.Estado == EstadoEmprestimo.Pendente);
            
            // 2. Sessões a validar (ProntoValidar)
            stats.Stat2 = await _context.Sessoes.CountAsync(s => s.Estado == EstadoSessao.ProntoValidar);
            
            // 3. Itens no marketplace (Available items)
            stats.Stat3 = await _context.Itens.CountAsync(i => i.Disponivel && i.Estado == EstadoItem.Aprovado);
            
            // 4. Total faturado (Faturas of last month)
            // Just a count of active students as a proxy for now or 0
            stats.Stat4 = await _context.Alunos.CountAsync();
            stats.TotalValor = await _context.Faturas.Where(f => f.DataEmissao.Month == DateTime.Now.Month).SumAsync(f => (decimal?)f.ValorTotal) ?? 0;

            // Global Activity
            stats.RecentActivities.AddRange(await GetRecentItems(null));
            stats.RecentActivities.AddRange(await GetRecentLoans(null));
        }
        else if (role == TipoUtilizador.Professor)
        {
            // Professor metrics:
            // 1. Pedidos para aceitar (Sessoes in PendenteProfessor state)
            stats.Stat1 = await _context.Sessoes.CountAsync(s => s.ProfessorId == userId && s.Estado == EstadoSessao.PendenteProfessor);
            
            // 2. Aulas esta semana (Agendadas in the next 7 days)
            var weekEnd = DateTime.Now.AddDays(7);
            stats.Stat2 = await _context.Sessoes.CountAsync(s => s.ProfessorId == userId && s.Estado == EstadoSessao.Agendada && s.DataHoraInicio >= DateTime.Now && s.DataHoraInicio <= weekEnd);
            
            // 3. Sessoes por confirmar (ProntoValidar)
            stats.Stat3 = await _context.Sessoes.CountAsync(s => s.ProfessorId == userId && s.Estado == EstadoSessao.ProntoValidar);

            // 4. Alunos activos (Distinct students in sessions this month)
            stats.Stat4 = await _context.Participantes
                .Where(p => p.Sessao.ProfessorId == userId && p.Sessao.DataHoraInicio.Month == DateTime.Now.Month)
                .Select(p => p.AlunoId)
                .Distinct()
                .CountAsync();

            // Activity (Professor's sessions)
            var recentSessions = await _context.Sessoes
                .Where(s => s.ProfessorId == userId)
                .Include(s => s.Modalidade)
                .OrderByDescending(s => s.Id)
                .Take(8)
                .Select(s => new RecentActivityDto
                {
                    Type = "Sessão",
                    Description = s.Modalidade != null ? $"Aula: {s.Modalidade.Nome}" : "Aula",
                    UserName = "Sistema",
                    Date = s.DataHoraInicio,
                    Status = s.Estado.ToString()
                })
                .ToListAsync();
            stats.RecentActivities.AddRange(recentSessions);
        }
        else // Encarregado
        {
            // Encarregado metrics:
            // 1. Marcações pendentes
            stats.Stat1 = await _context.Sessoes.CountAsync(s => s.Estado == EstadoSessao.PendenteProfessor && s.Participantes.Any(p => p.Aluno.EncarregadoId == userId));
            
            // 2. Aulas confirmadas (Agendada)
            stats.Stat2 = await _context.Sessoes.CountAsync(s => s.Estado == EstadoSessao.Agendada && s.Participantes.Any(p => p.Aluno.EncarregadoId == userId));
            
            // 3. Sessões por confirmar (waiting for parent's check/presence?)
            stats.Stat3 = await _context.Sessoes.CountAsync(s => s.Estado == EstadoSessao.ProntoValidar && s.Participantes.Any(p => p.Aluno.EncarregadoId == userId));
            
            // 4. Alugueres activos
            stats.Stat4 = await _context.Emprestimos.CountAsync(l => l.UtilizadorId == userId && l.Estado == EstadoEmprestimo.Aprovado);

        // Private Activity
        stats.RecentActivities.AddRange(await GetRecentItems(userId));
        stats.RecentActivities.AddRange(await GetRecentLoans(userId));
    }

    // Sort and limit final activities
    stats.RecentActivities = stats.RecentActivities
        .Where(a => a != null)
        .OrderByDescending(a => a.Date)
        .Take(8)
        .ToList();

    return Ok(stats);
}

private async Task<List<RecentActivityDto>> GetRecentItems(int? userId)
{
    var query = _context.Itens.AsQueryable();
    if (userId.HasValue) 
    {
        query = query.Where(i => i.ContribuidorId == userId.Value);
    }

    return await query
        .OrderByDescending(i => i.Id)
        .Take(5)
        .Select(i => new RecentActivityDto
        {
            Type = "Contribuição",
            Description = $"Item: {i.Nome}",
            UserName = i.Contribuidor != null ? i.Contribuidor.Nome : "Comunidade",
            Date = i.DataSubmissao,
            Status = i.Estado.ToString()
        })
        .ToListAsync();
}

private async Task<List<RecentActivityDto>> GetRecentLoans(int? userId)
{
    var query = _context.Emprestimos.AsQueryable();
    if (userId.HasValue)
    {
        query = query.Where(l => l.UtilizadorId == userId.Value);
    }

    return await query
        .OrderByDescending(l => l.Id)
        .Take(5)
        .Select(l => new RecentActivityDto
        {
            Type = "Empréstimo",
            Description = l.Item != null ? $"Item: {l.Item.Nome}" : "Item",
            UserName = l.Utilizador != null ? l.Utilizador.Nome : "Utilizador",
            Date = l.DataPedido,
            Status = l.Estado.ToString()
        })
        .ToListAsync();
}
}
