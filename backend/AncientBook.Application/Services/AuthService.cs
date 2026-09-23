using System;
using System.Threading.Tasks;
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
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;

        public AuthService(IUserRepository userRepository, IPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
        }

        public async Task<ApiResponse<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request)
        {
            if (await _userRepository.ExistsByUsernameAsync(request.Username))
            {
                return ApiResponse<RegisterResponseDto>.Fail("Tên đăng nhập đã tồn tại trên hệ thống.");
            }

            if (await _userRepository.ExistsByEmailAsync(request.Email))
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

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

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
                payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
            }
            catch (Exception)
            {
                return ApiResponse<RegisterResponseDto>.Fail("Mã xác thực Google không hợp lệ hoặc đã hết hạn.");
            }

            var email = payload.Email.ToLower();
            var user = await _userRepository.GetByEmailAsync(email);

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

            var baseUsername = email.Split('@')[0];
            var username = baseUsername;
            int counter = 1;

            while (await _userRepository.ExistsByUsernameAsync(username))
            {
                username = $"{baseUsername}{counter++}";
            }

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

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

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