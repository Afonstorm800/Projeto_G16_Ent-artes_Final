using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EntArtes.Infrastructure.Data;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EstudiosController : ControllerBase
{
    private readonly AppDbContext _context;

    public EstudiosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetEstudios()
    {
        var estudios = await _context.Estudios.ToListAsync();
        return Ok(estudios);
    }
}