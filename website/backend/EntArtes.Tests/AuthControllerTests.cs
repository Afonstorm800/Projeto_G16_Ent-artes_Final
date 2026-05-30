using EntArtes.API.Controllers;
using EntArtes.API.DTOs;
using EntArtes.API.Services;
using EntArtes.Core.Entities;
using EntArtes.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace EntArtes.Tests;

public class AuthControllerTests
{
    private AppDbContext GetDatabaseContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var databaseContext = new AppDbContext(options);
        databaseContext.Database.EnsureCreated();
        return databaseContext;
    }

    [Fact]
    public async Task UpdateProfile_ShouldUpdateNameAndEmail()
    {
        // Arrange
        var context = GetDatabaseContext();
        var authServiceMock = new Mock<IAuthService>();
        
        var user = new Utilizador { Id = 1, Nome = "Old Name", Email = "old@test.com", SenhaHash = "hash", Tipo = TipoUtilizador.Encarregado };
        context.Utilizadores.Add(user);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, authServiceMock.Object);

        // Simular o utilizador autenticado no contexto do Controller
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var updateDto = new UpdateProfileDto { Nome = "New Name", Email = "new@test.com" };

        // Act
        var result = await controller.UpdateProfile(updateDto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var updatedUser = await context.Utilizadores.FindAsync(1);

        Assert.Equal("New Name", updatedUser!.Nome);
        Assert.Equal("new@test.com", updatedUser.Email);
    }

    [Fact]
    public async Task UpdateProfile_ShouldFail_IfEmailAlreadyInUse()
    {
        // Arrange
        var context = GetDatabaseContext();
        var authServiceMock = new Mock<IAuthService>();
        
        context.Utilizadores.Add(new Utilizador { Id = 1, Nome = "User 1", Email = "user1@test.com", SenhaHash = "hash" });
        context.Utilizadores.Add(new Utilizador { Id = 2, Nome = "User 2", Email = "duplicate@test.com", SenhaHash = "hash" });
        await context.SaveChangesAsync();

        var controller = new AuthController(context, authServiceMock.Object);
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) }
        };

        var updateDto = new UpdateProfileDto { Nome = "User 1 Updated", Email = "duplicate@test.com" };

        // Act
        var result = await controller.UpdateProfile(updateDto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Email already in use", badRequestResult.Value!.ToString());
    }
}
