using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;
using EntArtes.Core.DTOs;
using EntArtes.Core.Entities;
using EntArtes.Core.Interfaces;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly ISchedulingService _scheduling;
    private readonly IConfirmationService _confirmation;

    public SessionsController(ISchedulingService scheduling, IConfirmationService confirmation)
    {
        _scheduling = scheduling;
        _confirmation = confirmation;
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] DateTime date, [FromQuery] int modalidadeId, [FromQuery] FormatoAula formato, [FromQuery] int? professorId = null)
    {
        var slots = await _scheduling.GetAvailableSlotsAsync(date, modalidadeId, formato, professorId);
        return Ok(slots);
    }

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] BookingRequestDto dto)
    {
        try 
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            
            var userId = int.Parse(userIdStr);
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
            var isDirecao = role.Equals("Direcao", StringComparison.OrdinalIgnoreCase);
            
            Console.WriteLine($"[SessionsController] CreateRequest: User={userId}, Role={role}, isDirecao={isDirecao}, Recurrence={dto.RecurrenceType}");
            
            var sessao = await _scheduling.CreateBookingRequestAsync(userId, dto, isDirecao);
            return Ok(sessao);
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.Message ?? "N/A";
            Console.WriteLine($"[SessionsController] ERROR in CreateRequest: {ex.Message} | Inner: {inner}");
            return BadRequest(new { message = ex.Message, inner });
        }
    }

    [HttpPost("{id}/professor-accept")]
    [Authorize(Roles = "Professor")]
    public async Task<IActionResult> ProfessorAccept(int id)
    {
        await _scheduling.ProfessorAcceptBookingAsync(id);
        return Ok();
    }

    [HttpPost("{id}/professor-reject")]
    [Authorize(Roles = "Professor")]
    public async Task<IActionResult> ProfessorReject(int id, [FromBody] string motivo)
    {
        await _scheduling.ProfessorRejectBookingAsync(id, motivo);
        return Ok();
    }

    [HttpPost("{id}/validate")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ValidateSession(int id)
    {
        await _confirmation.ValidateSessionAsync(id);
        return Ok();
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ApproveBooking(int id, [FromQuery] int? studioId = null)
    {
        await _scheduling.ApproveBookingAsync(id, studioId);
        return Ok();
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> RejectBooking(int id, [FromBody] string? motivo = null)
    {
        await _scheduling.RejectBookingAsync(id, motivo ?? "Rejeitado pela Direção");
        return Ok();
    }

    [HttpGet("pending-professor")]
    [Authorize(Roles = "Professor")]
    public async Task<IActionResult> GetPendingProfessor()
    {
        var professorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var sessions = await _scheduling.GetPendingProfessorSessionsAsync(professorId);
        return Ok(sessions);
    }

    [HttpGet("pending-direcao")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetPendingDirecao()
    {
        var sessions = await _scheduling.GetPendingDirecaoSessionsAsync();
        return Ok(sessions);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSession(int id)
    {
        var sessao = await _scheduling.GetSessionByIdAsync(id);
        if (sessao == null) return NotFound();
        return Ok(sessao);
    }

    [HttpPost("{id}/confirm-enc")]
    public async Task<IActionResult> ConfirmByEnc(int id)
    {
        await _confirmation.ConfirmByEncAsync(id);
        return Ok();
    }

    [HttpPost("{id}/confirm-prof")]
    public async Task<IActionResult> ConfirmByProf(int id)
    {
        await _confirmation.ConfirmByProfAsync(id);
        return Ok();
    }

    [HttpGet("get-confirmations")]
    public async Task<IActionResult> GetConfirmations()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var role = User.FindFirst(ClaimTypes.Role)!.Value;
        var sessions = await _confirmation.GetSessionsForConfirmationAsync(userId, role);
        return Ok(sessions);
    }

    [HttpGet("ready-for-validation")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetReadyForValidation()
    {
        var sessions = await _confirmation.GetSessionsReadyForValidationAsync();
        return Ok(sessions);
    }

    [HttpGet("my-schedule")]
    public async Task<IActionResult> GetMySchedule([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var role = User.FindFirst(ClaimTypes.Role)!.Value;
        Console.WriteLine($"[SessionsController] GetMySchedule: User={userId}, Role={role}, Start={startDate}, End={endDate}");
        var schedule = await _scheduling.GetMyScheduleAsync(userId, role, startDate, endDate);
        Console.WriteLine($"[SessionsController] GetMySchedule: Found {schedule.Count()} items");
        return Ok(schedule);
    }

    [HttpGet("general-schedule")]
    public async Task<IActionResult> GetGeneralSchedule([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var schedule = await _scheduling.GetGeneralScheduleAsync(startDate, endDate);
        return Ok(schedule);
    }

    [HttpDelete("delete/{id}")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        await _scheduling.DeleteSessionAsync(id);
        return Ok();
    }

    [HttpGet("availability")]
    [Authorize(Roles = "Professor")]
    public async Task<IActionResult> GetMyAvailability()
    {
        var professorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var availability = await _scheduling.GetProfessorAvailabilityAsync(professorId);
        return Ok(availability);
    }

    [HttpPost("availability")]
    [Authorize(Roles = "Professor")]
    public async Task<IActionResult> UpdateMyAvailability([FromBody] List<AvailabilityUpdateDto> availabilities)
    {
        var professorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        await _scheduling.UpdateProfessorAvailabilityAsync(professorId, availabilities);
        return Ok();
    }
}
