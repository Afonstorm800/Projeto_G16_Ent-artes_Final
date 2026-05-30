using System;
using System.Collections.Generic;

namespace EntArtes.Core.Entities;

public enum EstadoSessao
{
    PendenteProfessor,
    PendenteDirecao,
    Agendada,
    ProntoValidar,
    Concluida,
    Rejeitada
}

public enum FormatoAula
{
    Individual,
    Dueto,
    Trio,
    Ensemble
}

public class Sessao
{
    public int Id { get; set; }
    public DateTime DataHoraInicio { get; set; }
    public DateTime DataHoraFim { get; set; }
    public EstadoSessao Estado { get; set; }
    public FormatoAula Formato { get; set; }
    public string Objetivo { get; set; } = string.Empty;
    public bool EncConfirmado { get; set; } = false;
    public bool ProfConfirmado { get; set; } = false;
    public decimal Preco { get; set; }

    public int EstudioId { get; set; }
    public int ProfessorId { get; set; }
    public int ModalidadeId { get; set; }
    public int? FaturaId { get; set; }

    public Estudio Estudio { get; set; } = null!;
    public Utilizador Professor { get; set; } = null!;
    public Modalidade Modalidade { get; set; } = null!;
    public Fatura? Fatura { get; set; }

    public ICollection<Participante> Participantes { get; set; } = new List<Participante>();
}
