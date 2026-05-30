using System.ComponentModel.DataAnnotations;

namespace EntArtes.API.DTOs;

public class CreateStudentDto
{
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Required]
    public int EncarregadoId { get; set; }
}
