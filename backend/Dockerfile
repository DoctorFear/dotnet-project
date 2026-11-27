# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first to leverage layer caching
COPY AncientBook.slnx ./
COPY AncientBook.API/AncientBook.API.csproj AncientBook.API/
COPY AncientBook.Application/AncientBook.Application.csproj AncientBook.Application/
COPY AncientBook.Domain/AncientBook.Domain.csproj AncientBook.Domain/
COPY AncientBook.Infrastructure/AncientBook.Infrastructure.csproj AncientBook.Infrastructure/

RUN dotnet restore AncientBook.slnx

# Copy remaining source and publish API
COPY . .
WORKDIR /src/AncientBook.API
RUN dotnet publish AncientBook.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user on Debian-based .NET images
RUN useradd -m -u 10001 -s /bin/sh appuser && chown -R appuser:appuser /app
USER appuser

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
EXPOSE 8080

COPY --from=build --chown=appuser:appuser /app/publish .
ENTRYPOINT ["dotnet", "AncientBook.API.dll"]