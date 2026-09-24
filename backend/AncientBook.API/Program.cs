using AncientBook.Application.Interfaces;
using AncientBook.Application.Services;
using AncientBook.Infrastructure.Identity;
using AncientBook.Infrastructure.Persistence;
using AncientBook.Infrastructure.Repositories; // <-- Thêm using này nếu chưa có
using AncientBook.Infrastructure.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

Env.Load();
var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<ApplicationDbContext>());

// DI Service & Repository & Hasher
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddHttpClient<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<IEmailService, EmailService>();   

builder.Services.AddScoped<IUserRepository, UserRepository>(); // <-- BỔ SUNG DÒNG NÀY


builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();