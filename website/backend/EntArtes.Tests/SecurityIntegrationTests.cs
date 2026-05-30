using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EntArtes.API.Services;
using EntArtes.Core.Entities;
using EntArtes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Microsoft.Extensions.Configuration;
using Moq;

namespace EntArtes.Tests;

public class SecurityIntegrationTests
{
    private (AppDbContext, AuthService) GetContextAndService()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);

        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Jwt:Key"]).Returns("chave-de-teste-super-secreta-com-pelo-menos-32-chars");
        
        var authService = new AuthService(configMock.Object);
        return (context, authService);
    }

    [Fact]
    public async Task TokenRevocation_EndToEnd_Flow()
    {
        // 1. Setup - Criar utilizador com stamp inicial
        var (context, authService) = GetContextAndService();
        var user = new Utilizador 
        { 
            Id = 1, 
            Email = "prof@teste.pt", 
            Tipo = TipoUtilizador.Professor,
            SecurityStamp = Guid.NewGuid().ToString()
        };
        context.Utilizadores.Add(user);
        await context.SaveChangesAsync();

        // 2. Gerar Token
        var tokenString = authService.GenerateJwtToken(user);
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);
        var stampInToken = jwtToken.Claims.First(c => c.Type == "SecurityStamp").Value;

        // 3. Simular Validação (Sucesso)
        var userInDb = await context.Utilizadores.FindAsync(1);
        Assert.Equal(userInDb!.SecurityStamp, stampInToken);

        // 4. Atuar - Revogar Token (Mudar Stamp na DB)
        userInDb.SecurityStamp = Guid.NewGuid().ToString();
        await context.SaveChangesAsync();

        // 5. Simular Validação (Falha)
        var userAfterRevocation = await context.Utilizadores.FindAsync(1);
        Assert.NotEqual(userAfterRevocation!.SecurityStamp, stampInToken);
    }
}
