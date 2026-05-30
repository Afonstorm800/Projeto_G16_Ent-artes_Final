using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EntArtes.Core.Interfaces;
using EntArtes.Core.Entities;
using Microsoft.EntityFrameworkCore;
using EntArtes.Infrastructure.Data;

namespace EntArtes.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Direcao,Encarregado")]
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;
        private readonly AppDbContext _context;

        public BillingController(IBillingService billingService, AppDbContext context)
        {
            _billingService = billingService;
            _context = context;
        }

        // 1. Endpoint para Gerar o Relatório Mensal
        [HttpPost("processar")]
        [Authorize(Roles = "Direcao")]
        public async Task<IActionResult> ProcessarFaturacaoMensal([FromBody] BillingRequest request)
        {
            try
            {
                await _billingService.ProcessMonthlyBillingAsync(request.Ano, request.Mes);
                return Ok(new { message = "Faturação processada com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // NOVO: Endpoint para Gerar Relatório Individual
        [HttpPost("processar-individual")]
        [Authorize(Roles = "Direcao")]
        public async Task<IActionResult> ProcessarIndividual([FromBody] IndividualBillingRequest request)
        {
            Console.WriteLine($"[CONTROLLER] ProcessarIndividual: User={request.EncarregadoId}, Mes={request.Mes}, Ano={request.Ano}");
            try
            {
                await _billingService.ProcessSingleUserBillingAsync(request.Ano, request.Mes, request.EncarregadoId);
                return Ok(new { message = "Faturação individual processada com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. Endpoint para listar os relatórios (Faturas) gerados
        [HttpGet("faturas")]
        public async Task<IActionResult> GetFaturas([FromQuery] int ano, [FromQuery] int mes)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)!.Value;

            var query = _context.Faturas
                .Include(f => f.Utilizador)
                .Include(f => f.Sessoes)
                .Where(f => f.Ano == ano && f.Mes == mes);

            // Filtro de Segurança: Pai só vê as suas próprias faturas
            if (role == "Encarregado")
            {
                query = query.Where(f => f.UtilizadorId == userId);
            }

            var faturas = await query
                .Select(f => new {
                    id = f.Id,
                    guardian = f.Utilizador.Nome,
                    month = $"{f.Mes}/{f.Ano}",
                    sessions = f.Sessoes.Count,
                    total = f.ValorTotal,
                    paid = f.Paga,
                    excelGenerated = true
                })
                .ToListAsync();

            return Ok(faturas);
        }

        // 3. Endpoint para listar as sessões validadas (Concluídas) que ainda não foram faturadas
        [HttpGet("pendentes")]
        public async Task<IActionResult> GetSessoesPendentes()
        {
            try
            {
                // Fetch basic data first with explicit null handling for navigation properties
                var rawSessions = await _context.Sessoes
                    .Where(s => s.Estado == EstadoSessao.Concluida && s.FaturaId == null)
                    .Select(s => new
                    {
                        s.Id,
                        s.DataHoraInicio,
                        ProfessorNome = s.Professor != null ? s.Professor.Nome : "N/A",
                        ModalidadeNome = s.Modalidade != null ? s.Modalidade.Nome : "N/A",
                        // Force nullable int for the subquery result
                        EncarregadoId = s.Participantes.Select(p => (int?)p.Aluno.EncarregadoId).FirstOrDefault(),
                        Alunos = s.Participantes.Select(p => p.Aluno != null ? p.Aluno.Nome : "N/A").ToList()
                    })
                    .ToListAsync();

                // Format the results in-memory
                var result = rawSessions.Select(s => new
                {
                    id = s.Id,
                    dataHoraInicio = s.DataHoraInicio,
                    professorNome = s.ProfessorNome,
                    alunoNome = string.Join(", ", s.Alunos),
                    modalidadeNome = s.ModalidadeNome,
                    encarregadoId = s.EncarregadoId ?? 0,
                    mes = s.DataHoraInicio.Month,
                    ano = s.DataHoraInicio.Year
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERRO PENDENTES] {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[DETALHE] {ex.InnerException.Message}");
                return StatusCode(500, new { message = "Erro ao carregar sessões pendentes", detail = ex.Message });
            }
        }

        // 4. Endpoint para descarregar o Excel
        [HttpGet("download/{faturaId}")]
        public async Task<IActionResult> DownloadExcel(int faturaId)
        {
            try
            {
                var excelBytes = await _billingService.GenerateExcelForFaturaAsync(faturaId);
                return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Relatorio_{faturaId}.xlsx");
            }
            catch (Exception ex)
            {
                // Logar o erro no terminal para o desenvolvedor ver
                Console.WriteLine($"[ERRO EXCEL] Fatura {faturaId}: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[DETALHE] {ex.InnerException.Message}");
                
                return StatusCode(500, new { message = "Erro ao gerar Excel", detail = ex.Message });
            }
        }
    }

    public class BillingRequest
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
    }

    public class IndividualBillingRequest : BillingRequest
    {
        public int EncarregadoId { get; set; }
    }
}