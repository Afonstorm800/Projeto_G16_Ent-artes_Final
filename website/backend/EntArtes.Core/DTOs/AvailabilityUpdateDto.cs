using System;

namespace EntArtes.Core.DTOs;

public class AvailabilityUpdateDto
{
    public int DiaSemana { get; set; }
    public string HoraInicio { get; set; } = string.Empty; // Using string to ensure format compatibility
    public string HoraFim { get; set; } = string.Empty;
}
