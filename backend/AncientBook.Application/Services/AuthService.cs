using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs.Auth;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Google.Apis.Auth;

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
            var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());
            if (usernameExists)
            {
                return ApiResponse<RegisterResponseDto>.Fail("Tên đăng nhập đã tồn tại trên hệ thống.");
            }

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
            if (emailExists)
            {
                return ApiResponse<RegisterResponseDto>.Fail("Địa chỉ email này đã được sử dụng.");
            }

            var passwordHash = _passwordHasher.HashPassword(request.Password);

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

        public async Task<ApiResponse<RegisterResponseDto>> GoogleLoginAsync(GoogleLoginRequestDto request)
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                // Xác thực tính hợp lệ của IdToken từ Google
                payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
            }
            catch (Exception)
            {
                return ApiResponse<RegisterResponseDto>.Fail("Mã xác thực Google không hợp lệ hoặc đã hết hạn.");
            }

            var email = payload.Email.ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            // A1: Nếu email đã tồn tại -> Thông báo và tự động đăng nhập (trả về thông tin user)
            if (user != null)
            {
                if (!user.IsActive)
                {
                    return ApiResponse<RegisterResponseDto>.Fail("Tài khoản của bạn đã bị vô hiệu hóa.");
                }

                var existingUserResponse = new RegisterResponseDto
                {
                    UserId = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role.ToString(),
                    FPoints = user.FPoints,
                    CreatedAt = user.CreatedAt
                };

                return ApiResponse<RegisterResponseDto>.Ok(existingUserResponse, "Đăng nhập bằng tài khoản Google thành công!");
            }

            // A1: Nếu email chưa từng đăng ký -> Tự động tạo tài khoản mới với vai trò Member
            var baseUsername = email.Split('@')[0];
            var username = baseUsername;
            int counter = 1;

            // Đảm bảo username sinh tự động không bị trùng
            while (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
            {
                username = $"{baseUsername}{counter++}";
            }

            // Tạo mật khẩu ngẫu nhiên để thỏa mãn ràng buộc PasswordHash (User đăng nhập qua Google không dùng pass này)
            var dummyPassword = Guid.NewGuid().ToString("N") + "@Aa1";

            user = new User
            {
                Username = username,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(payload.Name) ? baseUsername : payload.Name,
                PhoneNumber = null,
                PasswordHash = _passwordHasher.HashPassword(dummyPassword),
                Role = UserRole.Member,
                FPoints = 0,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var newUserResponse = new RegisterResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                FPoints = user.FPoints,
                CreatedAt = user.CreatedAt
            };

            return ApiResponse<RegisterResponseDto>.Ok(newUserResponse, "Tạo tài khoản và đăng nhập bằng Google thành công!");
        }
    }
}