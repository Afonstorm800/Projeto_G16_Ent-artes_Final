using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EntArtes.Infrastructure.Data;

namespace EntArtes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModalidadesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ModalidadesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetModalidades()
    {
        var modalidades = await _context.Modalidades
            .Select(m => new { m.Id, m.Nome })
            .ToListAsync();
        return Ok(modalidades);
    }
}