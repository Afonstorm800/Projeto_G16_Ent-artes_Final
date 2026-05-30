# Ent'Artes - Backend (.NET 10)

## 📖 Sobre
API REST robusta desenvolvida para suportar as operações da Escola de Dança Ent'Artes. Utiliza uma arquitetura por camadas para garantir escalabilidade e manutenibilidade.

## 🛠️ Tecnologias
- **.NET 10** (ASP.NET Core API)
- **Entity Framework Core** (SQL Server)
- **JWT Bearer** (Segurança)
- **EPPlus** (Exportação Excel)
- **BCrypt.Net** (Hashing de passwords)

## 📂 Arquitetura da Solução
- **EntArtes.API:** Pontos de extremidade (Controllers), DTOs de entrada e configuração da DI.
- **EntArtes.Core:** Entidades de domínio, interfaces de serviço e lógica de negócio pura.
- **EntArtes.Infrastructure:** Implementação dos serviços, contexto da base de dados (EF Core) e migrações.
- **EntArtes.Tests:** Testes unitários utilizando xUnit e Moq.

## 🚀 Como Executar
1. Navegue para a pasta da API:
   ```sh
   cd EntArtes.API
   ```
2. Restaure e execute:
   ```sh
   dotnet run
   ```
3. O Swagger está disponível em `http://localhost:5063/swagger`.

## 🗄️ Base de Dados
O sistema utiliza SQL Server. A base de dados é criada e populada automaticamente (Seed Data) na primeira execução através do `DbInitializer.cs`.
Configuração em: `EntArtes.API/appsettings.json`.
