using EntArtes.Core.Entities;

namespace EntArtes.Core.DTOs;

public enum RecurrenceType
{
    None,
    Daily,
    Weekly,
    BiWeekly,
    Monthly,
    Yearly
}

public class BookingRequestDto
{
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public FormatoAula Formato { get; set; }
    public string Objetivo { get; set; } = string.Empty;
    public int ModalidadeId { get; set; }
    public int ProfessorId { get; set; }
    public int EstudioId { get; set; }
    public List<int> AlunosIds { get; set; } = new();
    
    // New fields
    public RecurrenceType RecurrenceType { get; set; } = RecurrenceType.None;
    public int RecurrenceCount { get; set; } = 1;
    public List<int>? RecurrenceDays { get; set; } // 0-6 for Weekly, 1-31 for Monthly
    public int? RecurrenceMonth { get; set; } // 1-12 for Yearly
}
