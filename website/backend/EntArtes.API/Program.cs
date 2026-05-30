using System.Security.Claims;
using EntArtes.API.Services;
using EntArtes.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using EntArtes.Core.Interfaces;
using EntArtes.Infrastructure.Services;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi;
using OfficeOpenXml;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("jwt_auth", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization. Paste your token below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("jwt_auth"),
            new List<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                           ?? Environment.GetEnvironmentVariable("DATABASE_URL");
    options.UseSqlServer(connectionString);
});

builder.Services.AddScoped<IAuthService, AuthService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] 
             ?? Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? throw new InvalidOperationException("JWT Key not configured");
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("Authentication failed: " + context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var userIdStr = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var stampInToken = context.Principal?.FindFirst("SecurityStamp")?.Value;

                if (int.TryParse(userIdStr, out int userId))
                {
                    var user = await dbContext.Utilizadores.FindAsync(userId);
                    if (user == null || user.SecurityStamp != stampInToken)
                    {
                        context.Response.Headers.Append("X-Token-Revoked", "true");
                        context.Fail("Token revoked or user role changed.");
                    }
                }
                else
                {
                    context.Fail("Invalid user in token.");
                }
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
                             ?? new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:8080" };
        
        var prodOrigin = Environment.GetEnvironmentVariable("FRONTEND_URL");
        if (!string.IsNullOrEmpty(prodOrigin))
        {
            allowedOrigins = allowedOrigins.Append(prodOrigin).ToArray();
        }

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthorization();

// Business services
builder.Services.AddScoped<ISchedulingService, SchedulingService>();
builder.Services.AddScoped<IConfirmationService, ConfirmationService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<IBillingService, BillingService>();
// Email service (temporary placeholder - implement later)
builder.Services.AddScoped<IEmailService, EmailService>();

ExcelPackage.License.SetNonCommercialPersonal("EntArtes");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Commented for easier local development with HTTP

app.UseRouting();
app.UseStaticFiles();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.InitializeAsync(dbContext);
}

app.Run();
