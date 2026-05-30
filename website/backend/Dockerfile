# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["EntArtes.API/EntArtes.API.csproj", "EntArtes.API/"]
COPY ["EntArtes.Core/EntArtes.Core.csproj", "EntArtes.Core/"]
COPY ["EntArtes.Infrastructure/EntArtes.Infrastructure.csproj", "EntArtes.Infrastructure/"]
RUN dotnet restore "EntArtes.API/EntArtes.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/EntArtes.API"
RUN dotnet build "EntArtes.API.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "EntArtes.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EntArtes.API.dll"]
