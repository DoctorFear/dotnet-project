using AncientBook.API.Hubs;
using AncientBook.API.Middlewares;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.Common.Interfaces.Repositories;
using AncientBook.Application.Interfaces;
using AncientBook.Application.Services;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using AncientBook.Domain.Interfaces;
using AncientBook.Infrastructure.Identity;
using AncientBook.Infrastructure.Persistence;
using AncientBook.Infrastructure.Persistence.Repositories;
using AncientBook.Infrastructure.Repositories;
using AncientBook.Infrastructure.Services;

using AncientBook.Infrastructure.Storage;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using QuestPDF.Infrastructure;
using System.Text;

Env.Load();
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<AncientBook.Application.Interfaces.IApplicationDbContext>(provider =>
    provider.GetRequiredService<ApplicationDbContext>());
builder.Services.AddScoped<IWorkflowDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

// DI Service & Repository & Hasher
builder.Services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddScoped<IHmacSha256Hasher, HmacSha256Hasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IEbookEditionRepository, EbookEditionRepository>();
builder.Services.AddScoped<IBookEmbeddingRepository, BookEmbeddingRepository>();

// 1. Repositories
builder.Services.AddScoped<IEbookEditionRepository, EbookEditionRepository>();
builder.Services.AddScoped<IBookEmbeddingRepository, BookEmbeddingRepository>();

// 2. Document & Storage
builder.Services.AddScoped<IDocumentExtractor, DocumentExtractorService>(); 
builder.Services.AddScoped<IFileStorageService, DropboxStorageService>();

// 3. Publishing & RAG Pipeline
builder.Services.AddScoped<ITextChunker, TextChunker>();
builder.Services.AddScoped<IGeminiEmbeddingService, GeminiEmbeddingService>();
builder.Services.AddScoped<IEbookPublishService, EbookPublishService>();
builder.Services.AddScoped<IRagSearchService, RagSearchService>();

builder.Services.AddScoped<ITtsDocumentExtractorService, TtsDocumentExtractorService>();
builder.Services.AddScoped<ITtsAudioService, TtsAudioService>();
builder.Services.AddScoped<IEbookTtsService, EbookTtsService>();
builder.Services.AddScoped<IBookTtsSegmentRepository, BookTtsSegmentRepository>();
builder.Services.AddScoped<IEbookTtsService, EbookTtsService>();

builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IPhysicalOrderService, PhysicalOrderService>();
builder.Services.AddScoped<IShipperService, ShipperService>();
builder.Services.AddScoped<IShipperRepository, ShipperRepository>();
builder.Services.AddScoped<IStockAlertRepository, StockAlertRepository>();
builder.Services.AddScoped<ISystemSettingRepository, SystemSettingRepository>();

builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddHttpClient<ICheckoutService, CheckoutService>();
builder.Services.AddHttpClient<IOrderService, OrderService>();

builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IFPointRepository, FPointsRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBookRepository, BookRepository>();

// UC18 - Đóng gói đơn hàng
builder.Services.AddScoped<IFulfillmentService, FulfillmentService>();

// UC21 - Đánh giá sách
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();

// UC19 - Giao hàng
builder.Services.AddScoped<IDeliveryService, DeliveryService>();
builder.Services.AddScoped<IWorkflowReadService, WorkflowReadService>();

// UC22 - Điểm thưởng
builder.Services.AddScoped<IFPointService, FPointService>();

// UC22 - Hạng thành viên
builder.Services.AddScoped<IMembershipTierRepository, MembershipTierRepository>();
builder.Services.AddScoped<ITierHistoryRepository, TierHistoryRepository>();

// Cache cấu hình hạng thành viên
builder.Services.AddMemoryCache();

// Đối soát điểm và hạng thành viên định kỳ
builder.Services.AddHostedService<TierUpgradeBackgroundService>();

builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IPublisherRepository, PublisherRepository>();
builder.Services.AddScoped<ISystemSettingRepository, SystemSettingRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IReportPdfExporter, ReportPdfExporter>();

builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IPublisherService, PublisherService>();
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<ISystemSettingService, SystemSettingService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IFileStorageService, DropboxStorageService>();
builder.Services.AddScoped<IFileStorageServices, LocalFileStorageService>();

builder.Services.AddHttpClient();
builder.Services.AddControllers();

// Đăng ký SignalR
builder.Services.AddSignalR();

// Cấu hình Authentication với JWT Bearer
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"] ?? throw new InvalidOperationException("JwtSettings:Secret chưa được cấu hình."));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// Cấu hình Swagger hỗ trợ nhập Token JWT Bearer
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AncientBook.API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Nhập token JWT (không cần gõ tiền tố Bearer)",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()
        }
    });
});

var app = builder.Build();
// ==================== SEED DATABASE KHI RUN ====================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();

        // Thực thi seed
        await DatabaseSeeder.SeedAsync(context, passwordHasher);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Đã xảy ra lỗi trong quá trình khởi tạo dữ liệu mẫu (Seeding).");
    }
}
// ==============================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseHttpsRedirection();

app.UseAuthentication();

app.UseMiddleware<TokenValidationMiddleware>();

app.UseAuthorization();
app.MapHub<LiveChatHub>("/hubs/chat");

app.MapControllers();

app.Run();
