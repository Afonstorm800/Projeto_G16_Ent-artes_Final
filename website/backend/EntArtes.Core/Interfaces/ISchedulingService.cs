using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;

namespace EntArtes.Core.Interfaces;

public interface ISchedulingService
{
    Task<List<AvailableSlotDto>> GetAvailableSlotsAsync(DateTime startDate, int modalidadeId, FormatoAula formato, int? professorId = null);
    Task<Sessao> CreateBookingRequestAsync(int userId, BookingRequestDto dto, bool isDirecao = false);
    Task<Sessao?> GetSessionByIdAsync(int id);
    Task ProfessorAcceptBookingAsync(int sessaoId);
    Task ProfessorRejectBookingAsync(int sessaoId, string motivo);
    Task ApproveBookingAsync(int sessaoId, int? studioId = null);
    Task RejectBookingAsync(int sessaoId, string motivo);
    Task<IEnumerable<Sessao>> GetPendingProfessorSessionsAsync(int professorId);
    Task<IEnumerable<Sessao>> GetPendingDirecaoSessionsAsync();
    
    // New methods for the new frontend pages
    Task<IEnumerable<Sessao>> GetMyScheduleAsync(int userId, string role, DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<Sessao>> GetGeneralScheduleAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task DeleteSessionAsync(int id);
    Task<IEnumerable<DisponibilidadeProfessor>> GetProfessorAvailabilityAsync(int professorId);
    Task UpdateProfessorAvailabilityAsync(int professorId, List<AvailabilityUpdateDto> availabilities);
}
