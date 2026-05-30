using EntArtes.API.Controllers;
using EntArtes.Core.Entities;
using EntArtes.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using EntArtes.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace EntArtes.Tests;

public class SecurityRevocationTests
{
    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private void SetupUser(ControllerBase controller, int userId, string role)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task ChangeRole_ShouldUpdateSecurityStamp()
    {
        // Arrange
        var context = GetDbContext();
        var authServiceMock = new Mock<IAuthService>();
        var user = new Utilizador
        {
            Id = 1,
            Nome = "Test",
            Email = "test@test.com",
            Tipo = TipoUtilizador.Professor,
            SecurityStamp = "old-stamp"
        };
        context.Utilizadores.Add(user);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, authServiceMock.Object);

        // Act
        var result = await controller.ChangeRole(1, TipoUtilizador.Encarregado);

        // Assert
        var updatedUser = await context.Utilizadores.FindAsync(1);
        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(TipoUtilizador.Encarregado, updatedUser!.Tipo);
        Assert.NotEqual("old-stamp", updatedUser.SecurityStamp);
    }

    [Fact]
    public async Task RevokeTokens_ShouldGenerateNewStamp()
    {
        // Arrange
        var context = GetDbContext();
        var authServiceMock = new Mock<IAuthService>();
        var userId = 1;
        var user = new Utilizador
        {
            Id = userId,
            Nome = "Test",
            Email = "test@test.com",
            SecurityStamp = "original-stamp"
        };
        context.Utilizadores.Add(user);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, authServiceMock.Object);
        SetupUser(controller, userId, "Professor");

        // Act
        var result = await controller.RevokeTokens(userId);

        // Assert
        var updatedUser = await context.Utilizadores.FindAsync(userId);
        Assert.IsType<OkObjectResult>(result);
        Assert.NotEqual("original-stamp", updatedUser!.SecurityStamp);
    }
}