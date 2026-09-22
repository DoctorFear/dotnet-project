using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs.Auth;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;

namespace AncientBook.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public AuthService(IApplicationDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<ApiResponse<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request)
        {
            // Kiểm tra BR01 & E2: Trùng Username
            var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());
            if (usernameExists)
            {
                return ApiResponse<RegisterResponseDto>.Fail("Tên đăng nhập đã tồn tại trên hệ thống.");
            }

            // Kiểm tra BR01 & E2: Trùng Email
            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
            if (emailExists)
            {
                return ApiResponse<RegisterResponseDto>.Fail("Địa chỉ email này đã được sử dụng.");
            }

            // BR04: Hash mật khẩu bằng BCrypt
            var passwordHash = _passwordHasher.HashPassword(request.Password);

            // BR03 & Bước 6: Mặc định vai trò Member, FPoints = 0, IsActive = true
            var user = new User
            {
                Username = request.Username.Trim(),
                Email = request.Email.Trim().ToLower(),
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber?.Trim(),
                PasswordHash = passwordHash,
                Role = UserRole.Member,
                FPoints = 0,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var responseData = new RegisterResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                FPoints = user.FPoints,
                CreatedAt = user.CreatedAt
            };

            return ApiResponse<RegisterResponseDto>.Ok(responseData, "Đăng ký tài khoản thành công!");
        }
    }
}