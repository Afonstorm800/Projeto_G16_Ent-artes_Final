using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using EntArtes.Core.Entities;

namespace EntArtes.API.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _config;

    public AuthService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateJwtToken(Utilizador user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"] 
            ?? throw new InvalidOperationException("JWT Key missing"));
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("SecurityStamp", user.SecurityStamp),
                new Claim(ClaimTypes.Role, Enum.GetName(typeof(TipoUtilizador), user.Tipo) ?? user.Tipo.ToString())
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public bool VerifyPassword(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
