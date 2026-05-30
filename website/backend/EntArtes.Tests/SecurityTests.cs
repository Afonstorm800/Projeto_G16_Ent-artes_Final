using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EntArtes.API.Controllers;
using Xunit;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Moq;
using EntArtes.Core.Interfaces;
using EntArtes.API.Services;
using EntArtes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using EntArtes.Core.Entities;

namespace EntArtes.Tests;

public class SecurityTests
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

    [Theory]
    [InlineData(typeof(DashboardController))]
    public void Controllers_ShouldHaveAuthorizeAttribute(Type controllerType)
    {
        // Act
        var attribute = controllerType.GetCustomAttribute<AuthorizeAttribute>();

        // Assert
        Assert.NotNull(attribute);
    }

    [Theory]
    [InlineData(typeof(BillingController), "Direcao,Encarregado")]
    public void Controllers_ShouldHaveCorrectRoleRequirement(Type controllerType, string expectedRole)
    {
        // Act
        var attribute = controllerType.GetCustomAttribute<AuthorizeAttribute>();

        // Assert
        Assert.NotNull(attribute);
        Assert.Equal(expectedRole, attribute.Roles);
    }

    [Theory]
    [InlineData(typeof(InventoryController), "GetPendingItems", "Direcao")]
    [InlineData(typeof(InventoryController), "ApproveItem", "Direcao")]
    [InlineData(typeof(InventoryController), "RejectItem", "Direcao")]
    [InlineData(typeof(InventoryController), "GetAllSales", "Direcao")]
    public void ControllerMethods_ShouldHaveCorrectRoleRequirement(Type controllerType, string methodName, string expectedRole)
    {
        // Act
        var method = controllerType.GetMethod(methodName);
        var attribute = method?.GetCustomAttribute<AuthorizeAttribute>();

        // Assert
        Assert.NotNull(attribute);
        Assert.Equal(expectedRole, attribute.Roles);
    }

    [Fact]
    public async Task GetMyStudents_ShouldOnlyReturnStudentsForAuthenticatedUser()
    {
        // Arrange
        var context = GetDatabaseContext();
        var authServiceMock = new Mock<IAuthService>();

        // User 1 (Pai 1)
        context.Utilizadores.Add(new Utilizador { Id = 1, Nome = "Pai 1", Tipo = TipoUtilizador.Encarregado });
        context.Alunos.Add(new Aluno { Id = 101, Nome = "Filho 1", EncarregadoId = 1 });

        // User 2 (Pai 2)
        context.Utilizadores.Add(new Utilizador { Id = 2, Nome = "Pai 2", Tipo = TipoUtilizador.Encarregado });
        context.Alunos.Add(new Aluno { Id = 102, Nome = "Filho 2", EncarregadoId = 2 });

        await context.SaveChangesAsync();

        var controller = new AuthController(context, authServiceMock.Object);

        // Simulate User 1 logged in
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) }
        };

        // Act
        var result = await controller.GetMyStudents();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var students = okResult.Value as IEnumerable<object>;

        Assert.NotNull(students);
        var studentsList = students.ToList();
        Assert.Single(studentsList);

        // Check if it's the correct student
        var student = studentsList[0];
        var idProperty = student.GetType().GetProperty("Id");
        Assert.NotNull(idProperty);
        Assert.Equal(101, (int)(idProperty.GetValue(student, null) ?? 0));
    }

    [Fact]
    public async Task GetMySales_ShouldPassCorrectUserIdToService()
    {
        // Arrange
        var inventoryServiceMock = new Mock<IInventoryService>();
        var controller = new InventoryController(inventoryServiceMock.Object);

        var userId = 5;
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) }
        };

        // Act
        await controller.GetMySales();

        // Assert
        inventoryServiceMock.Verify(s => s.GetMySalesAsync(userId), Times.Once);
    }
}