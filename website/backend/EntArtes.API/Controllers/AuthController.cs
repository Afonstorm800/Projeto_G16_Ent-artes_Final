using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EntArtes.API.Services;
using EntArtes.Core.Entities;
using EntArtes.Infrastructure.Data;
using EntArtes.API.DTOs;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuthService _auth;

    public AuthController(AppDbContext context, IAuthService auth)
    {
        _context = context;
        _auth = auth;
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(UpdateProfileDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Utilizadores.FindAsync(userId);

        if (user == null) return NotFound();

        // Verificar se o novo email já está em uso por outro utilizador
        if (user.Email != dto.Email && await _context.Utilizadores.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already in use" });

        user.Nome = dto.Nome;
        user.Email = dto.Email;

        await _context.SaveChangesAsync();

        return Ok(new { user.Nome, user.Email });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Utilizadores.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already registered" });

        var user = new Utilizador
        {
            Nome = dto.Nome,
            Email = dto.Email,
            SenhaHash = _auth.HashPassword(dto.Password),
            Tipo = dto.Tipo
        };

        _context.Utilizadores.Add(user);
        await _context.SaveChangesAsync();

        var token = _auth.GenerateJwtToken(user);
        return Ok(new { token, user.Tipo, user.Nome, user.Id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Utilizadores.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !_auth.VerifyPassword(dto.Password, user.SenhaHash))
            return Unauthorized(new { message = "Invalid email or password" });

        var token = _auth.GenerateJwtToken(user);
        return Ok(new { token, user.Tipo, user.Nome, user.Id });
    }

    [HttpGet("professors")]
    public async Task<IActionResult> GetProfessors()
    {
        var professors = await _context.Utilizadores
            .Where(u => u.Tipo == TipoUtilizador.Professor)
            .Select(u => new 
            { 
                u.Id, 
                u.Nome,
                Modalidades = u.ProfessorModalidades.Select(pm => new { pm.Modalidade.Id, pm.Modalidade.Nome })
            })
            .ToListAsync();
        return Ok(professors);
    }

    [HttpGet("my-students")]
    [Authorize]
    public async Task<IActionResult> GetMyStudents()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var students = await _context.Alunos
            .Where(a => a.EncarregadoId == userId)
            .Select(a => new { a.Id, a.Nome })
            .ToListAsync();
        return Ok(students);
    }

    [HttpGet("all-students")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetAllStudents()
    {
        var students = await _context.Alunos
            .Include(a => a.Encarregado)
            .Select(a => new { a.Id, a.Nome, EncarregadoNome = a.Encarregado.Nome })
            .ToListAsync();
        return Ok(students);
    }

    [HttpGet("encarregados")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> GetEncarregados()
    {
        var encs = await _context.Utilizadores
            .Where(u => u.Tipo == TipoUtilizador.Encarregado)
            .Select(u => new { u.Id, u.Nome, u.Email })
            .ToListAsync();
        return Ok(encs);
    }

    [HttpPost("create-teacher")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> CreateTeacher(RegisterDto dto)
    {
        if (await _context.Utilizadores.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already registered" });

        var user = new Utilizador
        {
            Nome = dto.Nome,
            Email = dto.Email,
            SenhaHash = _auth.HashPassword(dto.Password),
            Tipo = TipoUtilizador.Professor
        };

        _context.Utilizadores.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { user.Id, user.Nome, user.Email });
    }

    [HttpPost("create-student")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> CreateStudent(CreateStudentDto dto)
    {
        var enc = await _context.Utilizadores.FindAsync(dto.EncarregadoId);
        if (enc == null || enc.Tipo != TipoUtilizador.Encarregado)
            return BadRequest(new { message = "Encarregado not found" });

        var aluno = new Aluno
        {
            Nome = dto.Nome,
            EncarregadoId = dto.EncarregadoId
        };

        _context.Alunos.Add(aluno);
        await _context.SaveChangesAsync();

        return Ok(new { aluno.Id, aluno.Nome, EncarregadoNome = enc.Nome });
    }

    [HttpPost("users/{id}/change-role")]
    [Authorize(Roles = "Direcao")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] TipoUtilizador novoTipo)
    {
        var user = await _context.Utilizadores.FindAsync(id);
        if (user == null) return NotFound();

        user.Tipo = novoTipo;
        user.SecurityStamp = Guid.NewGuid().ToString(); // Invalida tokens atuais

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Role updated to {novoTipo} and tokens revoked." });
    }

    [HttpPost("users/{id}/revoke-tokens")]
    [Authorize]
    public async Task<IActionResult> RevokeTokens(int id)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var currentUserRole = User.FindFirst(ClaimTypes.Role)!.Value;

        // Só pode revogar se for o próprio utilizador OU se for a Direção
        if (currentUserId != id && currentUserRole != "Direcao")
        {
            return Forbid();
        }

        var user = await _context.Utilizadores.FindAsync(id);
        if (user == null) return NotFound();

        user.SecurityStamp = Guid.NewGuid().ToString();
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "All tokens for this user have been revoked." });
    }
}
