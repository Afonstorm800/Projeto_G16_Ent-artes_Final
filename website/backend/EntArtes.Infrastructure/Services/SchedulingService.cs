using Microsoft.EntityFrameworkCore;
using System.Linq;
using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;
using EntArtes.Infrastructure.Data;

namespace EntArtes.Infrastructure.Services;

public class SchedulingService : ISchedulingService
{
    private readonly AppDbContext _context;

    public SchedulingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(DateTime startDate, int modalidadeId, FormatoAula formato, int? professorId = null)
    {
        // 1. Get compatible studios for this modality
        var compatibleStudioIds = await _context.EstudioModalidades
            .Where(em => em.ModalidadeId == modalidadeId)
            .Select(em => em.EstudioId)
            .ToListAsync();

        // 2. Get professors that can teach this modality
        var professorQuery = _context.ProfessorModalidades
            .Where(pm => pm.ModalidadeId == modalidadeId);
        
        if (professorId.HasValue)
        {
            professorQuery = professorQuery.Where(pm => pm.ProfessorId == professorId.Value);
        }

        var professorIds = await professorQuery.Select(pm => pm.ProfessorId).ToListAsync();

        // 3. Get professor availabilities (recurring)
        var availabilities = await _context.DisponibilidadesProfessores
            .Where(dp => professorIds.Contains(dp.ProfessorId))
            .Include(dp => dp.Professor)
            .ToListAsync();

        var slots = new List<AvailableSlotDto>();
        var duration = GetDurationForFormato(formato);

        // 4. Generate slots for the next 7 days
        for (int i = 0; i < 7; i++)
        {
            var date = startDate.AddDays(i).Date;
            var dayOfWeek = (int)date.DayOfWeek;

            var dailyAvailabilities = availabilities.Where(a => a.DiaSemana == dayOfWeek).ToList();

            foreach (var avail in dailyAvailabilities)
            {
                var start = date + avail.HoraInicio;
                var end = date + avail.HoraFim;

                // Get existing sessions in this range for this professor or compatible studios
                var existingSessions = await _context.Sessoes
                    .Where(s => s.Estado != EstadoSessao.Rejeitada &&
                                (s.ProfessorId == avail.ProfessorId || compatibleStudioIds.Contains(s.EstudioId)) &&
                                s.DataHoraInicio < end && s.DataHoraFim > start)
                    .Select(s => new { s.DataHoraInicio, s.DataHoraFim, s.ProfessorId, s.EstudioId })
                    .ToListAsync();

                foreach (var studioId in compatibleStudioIds)
                {
                    var studio = await _context.Estudios.FindAsync(studioId);
                    var current = start;
                    while (current.Add(duration) <= end)
                    {
                        var slotEnd = current.Add(duration);
                        
                        // Check if THIS specific professor or studio is occupied in this slot
                        bool isOccupied = existingSessions.Any(s => 
                            (s.ProfessorId == avail.ProfessorId || s.EstudioId == studioId) &&
                            s.DataHoraInicio < slotEnd && s.DataHoraFim > current);

                        if (!isOccupied)
                        {
                            slots.Add(new AvailableSlotDto
                            {
                                StartTime = current,
                                EndTime = slotEnd,
                                EstudioId = studioId,
                                EstudioNome = studio?.Nome ?? string.Empty,
                                ProfessorId = avail.ProfessorId,
                                ProfessorNome = avail.Professor.Nome
                            });
                        }
                        
                        current = current.Add(duration);
                    }
                }
            }
        }

        return slots.OrderBy(s => s.StartTime).ToList();
    }

    public async Task<Sessao> CreateBookingRequestAsync(int userId, BookingRequestDto dto, bool isDirecao = false)
    {
        Console.WriteLine($"[CREATE] Request by user {userId}. isDirecao={isDirecao}. Recurrence={dto.RecurrenceType}, Count={dto.RecurrenceCount}");
        
        var professor = await _context.Utilizadores.FindAsync(dto.ProfessorId);
        if (professor == null || professor.Tipo != TipoUtilizador.Professor)
            throw new Exception("Invalid professor");

        var studio = await _context.Estudios.FindAsync(dto.EstudioId);
        if (studio == null) throw new Exception("Invalid studio");

        var modalidade = await _context.Modalidades.FindAsync(dto.ModalidadeId);
        if (modalidade == null) throw new Exception("Invalid modalidade");

        List<DateTime> sessionDates = CalculateSessionDates(dto);
        Console.WriteLine($"[CREATE] Calculated {sessionDates.Count} dates for recurrence: {string.Join(", ", sessionDates.Select(d => d.ToString("g")))}");
        
        Sessao firstSessao = null!;

        foreach (var date in sessionDates)
        {
            var start = date;
            var end = date.Date.Add(dto.DataHoraFim.TimeOfDay);
            if (end <= start) end = start.AddHours(1);

            Console.WriteLine($"[CREATE] Creating session: {start:g} to {end:t} | State={(isDirecao ? "Agendada" : "PendenteProfessor")}");

            var sessao = new Sessao
            {
                DataHoraInicio = start,
                DataHoraFim = end,
                Estado = isDirecao ? EstadoSessao.Agendada : EstadoSessao.PendenteProfessor,
                Formato = dto.Formato,
                Objetivo = dto.Objetivo ?? string.Empty,
                EncConfirmado = false,
                ProfConfirmado = false,
                Preco = CalculatePreco(dto.Formato),
                EstudioId = dto.EstudioId,
                ProfessorId = dto.ProfessorId,
                ModalidadeId = dto.ModalidadeId,
                FaturaId = null
            };

            _context.Sessoes.Add(sessao);
            await _context.SaveChangesAsync();

            if (firstSessao == null) firstSessao = sessao;

            if (dto.AlunosIds != null && dto.AlunosIds.Any())
            {
                foreach (var alunoId in dto.AlunosIds)
                {
                    var aluno = isDirecao 
                        ? await _context.Alunos.FindAsync(alunoId)
                        : await _context.Alunos.FirstOrDefaultAsync(a => a.Id == alunoId && a.EncarregadoId == userId);
                        
                    if (aluno != null)
                    {
                        _context.Participantes.Add(new Participante { SessaoId = sessao.Id, AlunoId = alunoId });
                    }
                }
                await _context.SaveChangesAsync();
            }
        }

        if (firstSessao == null) throw new Exception("Não foi possível criar nenhuma sessão.");
        return firstSessao;
    }

    private List<DateTime> CalculateSessionDates(BookingRequestDto dto)
    {
        var dates = new List<DateTime>();
        var baseStart = dto.DataHoraInicio;

        if (dto.RecurrenceType == RecurrenceType.None)
        {
            dates.Add(baseStart);
            return dates;
        }

        int count = Math.Max(1, dto.RecurrenceCount);

        for (int i = 0; i < count; i++)
        {
            switch (dto.RecurrenceType)
            {
                case RecurrenceType.Daily:
                    dates.Add(baseStart.AddDays(i));
                    break;
                case RecurrenceType.Weekly:
                    if (dto.RecurrenceDays != null && dto.RecurrenceDays.Any())
                    {
                        // Get the start of the week for the base date (Monday)
                        // DayOfWeek.Sunday is 0, Monday is 1, etc.
                        int currentDay = (int)baseStart.DayOfWeek;
                        int daysToSubtract = (currentDay == 0) ? 6 : currentDay - 1;
                        var startOfWeek = baseStart.AddDays(-daysToSubtract).Date;

                        foreach (var day in dto.RecurrenceDays)
                        {
                            // day is 1 (Mon) to 6 (Sat) and 0 (Sun)
                            int offset = (day == 0) ? 6 : day - 1; 
                            var weekDate = startOfWeek.AddDays((i * 7) + offset);
                            
                            var finalDate = weekDate.Date.Add(baseStart.TimeOfDay);
                            dates.Add(finalDate);
                        }
                    }
                    else
                    {
                        dates.Add(baseStart.AddDays(i * 7));
                    }
                    break;
                case RecurrenceType.BiWeekly:
                    if (dto.RecurrenceDays != null && dto.RecurrenceDays.Any())
                    {
                        int currentDay = (int)baseStart.DayOfWeek;
                        int daysToSubtract = (currentDay == 0) ? 6 : currentDay - 1;
                        var startOfWeek = baseStart.AddDays(-daysToSubtract).Date;

                        foreach (var day in dto.RecurrenceDays)
                        {
                            int offset = (day == 0) ? 6 : day - 1;
                            var weekDate = startOfWeek.AddDays((i * 14) + offset);
                            var finalDate = weekDate.Date.Add(baseStart.TimeOfDay);
                            dates.Add(finalDate);
                        }
                    }
                    else
                    {
                        dates.Add(baseStart.AddDays(i * 14));
                    }
                    break;
                case RecurrenceType.Monthly:
                    var monthDay = (dto.RecurrenceDays != null && dto.RecurrenceDays.Any()) ? dto.RecurrenceDays[0] : baseStart.Day;
                    try {
                        var nextMonth = baseStart.AddMonths(i);
                        var actualDay = Math.Min(monthDay, DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month));
                        dates.Add(new DateTime(nextMonth.Year, nextMonth.Month, actualDay, baseStart.Hour, baseStart.Minute, 0, baseStart.Kind));
                    } catch { dates.Add(baseStart.AddMonths(i)); }
                    break;
                case RecurrenceType.Yearly:
                    var yearDay = (dto.RecurrenceDays != null && dto.RecurrenceDays.Any()) ? dto.RecurrenceDays[0] : baseStart.Day;
                    var yearMonth = dto.RecurrenceMonth ?? baseStart.Month;
                    try {
                        var nextYear = baseStart.AddYears(i);
                        var actualDay = Math.Min(yearDay, DateTime.DaysInMonth(nextYear.Year, yearMonth));
                        dates.Add(new DateTime(nextYear.Year, yearMonth, actualDay, baseStart.Hour, baseStart.Minute, 0, baseStart.Kind));
                    } catch { dates.Add(baseStart.AddYears(i)); }
                    break;
            }
        }

        return dates.Distinct().OrderBy(d => d).ToList();
    }

    private DateTime GetNextWeekday(DateTime start, int dayOfWeek)
    {
        int startDay = (int)start.DayOfWeek;
        int daysToAdd = (dayOfWeek - startDay + 7) % 7;
        return start.AddDays(daysToAdd);
    }

    public async Task<Sessao?> GetSessionByIdAsync(int id) => await _context.Sessoes.FindAsync(id);

    public async Task ProfessorAcceptBookingAsync(int sessaoId)
    {
        var sessao = await _context.Sessoes.FindAsync(sessaoId);
        if (sessao == null) throw new Exception("Session not found");
        if (sessao.Estado != EstadoSessao.PendenteProfessor) throw new Exception("Invalid state for professor approval");
        sessao.Estado = EstadoSessao.PendenteDirecao;
        await _context.SaveChangesAsync();
    }

    public async Task ProfessorRejectBookingAsync(int sessaoId, string motivo)
    {
        var sessao = await _context.Sessoes.FindAsync(sessaoId);
        if (sessao == null) throw new Exception("Session not found");
        sessao.Estado = EstadoSessao.Rejeitada;
        await _context.SaveChangesAsync();
    }

    public async Task ApproveBookingAsync(int sessaoId, int? studioId = null)
    {
        var sessao = await _context.Sessoes.FindAsync(sessaoId);
        if (sessao == null) throw new Exception("Session not found");
        if (sessao.Estado != EstadoSessao.PendenteDirecao) throw new Exception("Session must be approved by professor first");
        
        if (studioId.HasValue)
        {
            var studio = await _context.Estudios.FindAsync(studioId.Value);
            if (studio != null) sessao.EstudioId = studioId.Value;
        }

        sessao.Estado = EstadoSessao.Agendada;
        await _context.SaveChangesAsync();
    }

    public async Task RejectBookingAsync(int sessaoId, string motivo)
    {
        var sessao = await _context.Sessoes.FindAsync(sessaoId);
        if (sessao == null) throw new Exception("Session not found");
        sessao.Estado = EstadoSessao.Rejeitada;
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Sessao>> GetPendingProfessorSessionsAsync(int professorId)
    {
        return await _context.Sessoes
            .Where(s => s.ProfessorId == professorId && s.Estado == EstadoSessao.PendenteProfessor)
            .Include(s => s.Modalidade)
            .Include(s => s.Participantes).ThenInclude(p => p.Aluno)
            .ToListAsync();
    }

    public async Task<IEnumerable<Sessao>> GetPendingDirecaoSessionsAsync()
    {
        return await _context.Sessoes
            .Where(s => s.Estado == EstadoSessao.PendenteDirecao)
            .Include(s => s.Modalidade)
            .Include(s => s.Professor)
            .Include(s => s.Participantes).ThenInclude(p => p.Aluno)
            .ToListAsync();
    }

    public async Task<IEnumerable<Sessao>> GetMyScheduleAsync(int userId, string role, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Sessoes.AsQueryable();

        if (role.Equals("Professor", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.ProfessorId == userId && 
                                     (s.Estado == EstadoSessao.Agendada || 
                                      s.Estado == EstadoSessao.PendenteProfessor || 
                                      s.Estado == EstadoSessao.PendenteDirecao));
        }
        else if (role.Equals("Encarregado", StringComparison.OrdinalIgnoreCase) || role.Equals("encarregado", StringComparison.OrdinalIgnoreCase))
        {
            var studentIds = await _context.Alunos
                .Where(a => a.EncarregadoId == userId)
                .Select(a => a.Id)
                .ToListAsync();

            query = query.Where(s => s.Participantes.Any(p => studentIds.Contains(p.AlunoId)) && 
                                     (s.Estado == EstadoSessao.Agendada || 
                                      s.Estado == EstadoSessao.PendenteProfessor || 
                                      s.Estado == EstadoSessao.PendenteDirecao));
        }

        if (startDate.HasValue) query = query.Where(s => s.DataHoraInicio >= startDate.Value);
        if (endDate.HasValue) query = query.Where(s => s.DataHoraInicio <= endDate.Value);

        return await query
            .Include(s => s.Modalidade)
            .Include(s => s.Professor)
            .Include(s => s.Estudio)
            .Include(s => s.Participantes).ThenInclude(p => p.Aluno)
            .OrderBy(s => s.DataHoraInicio)
            .ToListAsync();
    }

    public async Task<IEnumerable<Sessao>> GetGeneralScheduleAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Sessoes
            .Where(s => s.Estado != EstadoSessao.Rejeitada)
            .Include(s => s.Modalidade)
            .Include(s => s.Professor)
            .Include(s => s.Estudio)
            .Include(s => s.Participantes).ThenInclude(p => p.Aluno)
            .AsQueryable();

        if (startDate.HasValue) query = query.Where(s => s.DataHoraInicio >= startDate.Value);
        if (endDate.HasValue) query = query.Where(s => s.DataHoraInicio <= endDate.Value);

        return await query.OrderBy(s => s.DataHoraInicio).ToListAsync();
    }

    public async Task DeleteSessionAsync(int id)
    {
        var sessao = await _context.Sessoes
            .Include(s => s.Participantes)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sessao != null)
        {
            _context.Participantes.RemoveRange(sessao.Participantes);
            _context.Sessoes.Remove(sessao);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<DisponibilidadeProfessor>> GetProfessorAvailabilityAsync(int professorId)
    {
        return await _context.DisponibilidadesProfessores
            .Where(dp => dp.ProfessorId == professorId)
            .ToListAsync();
    }

    public async Task UpdateProfessorAvailabilityAsync(int professorId, List<AvailabilityUpdateDto> availabilities)
    {
        var current = await _context.DisponibilidadesProfessores
            .Where(dp => dp.ProfessorId == professorId)
            .ToListAsync();
            
        _context.DisponibilidadesProfessores.RemoveRange(current);
        
        foreach(var a in availabilities)
        {
            _context.DisponibilidadesProfessores.Add(new DisponibilidadeProfessor
            {
                ProfessorId = professorId,
                DiaSemana = a.DiaSemana,
                HoraInicio = TimeSpan.Parse(a.HoraInicio),
                HoraFim = TimeSpan.Parse(a.HoraFim),
                Recorrente = true
            });
        }
        
        await _context.SaveChangesAsync();
    }

    private TimeSpan GetDurationForFormato(FormatoAula formato) => formato switch
    {
        FormatoAula.Individual => TimeSpan.FromHours(1),
        FormatoAula.Dueto => TimeSpan.FromHours(1),
        FormatoAula.Trio => TimeSpan.FromHours(1.5),
        FormatoAula.Ensemble => TimeSpan.FromHours(2),
        _ => TimeSpan.FromHours(1)
    };

    private decimal CalculatePreco(FormatoAula formato) => formato switch
    {
        FormatoAula.Individual => 30m,
        FormatoAula.Dueto => 45m,
        FormatoAula.Trio => 60m,
        FormatoAula.Ensemble => 80m,
        _ => 30m
    };
}