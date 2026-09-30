// AncientBook.API/Middlewares/TokenValidationMiddleware.cs
using System.Security.Claims;
using AncientBook.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace AncientBook.API.Middlewares
{
    public class TokenValidationMiddleware
    {
        private readonly RequestDelegate _next;

        public TokenValidationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tokenVersionClaim = context.User.FindFirst("token_version")?.Value;

                if (int.TryParse(userIdClaim, out int userId) && int.TryParse(tokenVersionClaim, out int tokenVersion))
                {
                    // Truy vấn nhanh phiên bản token và trạng thái tài khoản
                    var userStatus = await dbContext.Users
                        .AsNoTracking()
                        .Where(u => u.Id == userId)
                        .Select(u => new { u.TokenVersion, u.IsActive })
                        .FirstOrDefaultAsync();

                    // Nếu user không tồn tại, bị khóa, hoặc token version lệch -> Chặn ngay lập tức (BR04)
                    if (userStatus == null || !userStatus.IsActive || userStatus.TokenVersion != tokenVersion)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync("{\"isSuccess\":false,\"message\":\"Phiên làm việc đã hết hạn hoặc tài khoản đã bị khóa. Vui lòng đăng nhập lại.\"}");
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}