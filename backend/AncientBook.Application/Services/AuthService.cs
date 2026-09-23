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


        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request)
        {
            // E1: Kiểm tra dữ liệu không được để trống
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return ApiResponse<LoginResponseDto>.Fail("Tên đăng nhập và mật khẩu không được để trống.");
            }

            // Tìm kiếm user theo Username
            var user = await _userRepository.GetByUsernameAsync(request.Username);

            // E2 & BR01: Sai thông tin -> Báo lỗi chung chung chống rà quét tài khoản
            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return ApiResponse<LoginResponseDto>.Fail("Tên đăng nhập hoặc mật khẩu không chính xác.");
            }

            // E3 & BR03: Kiểm tra tài khoản bị khóa / vô hiệu hóa
            if (!user.IsActive)
            {
                return ApiResponse<LoginResponseDto>.Fail("Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ hotline để được hỗ trợ.");
            }

            // Đóng gói dữ liệu trả về phục vụ điều hướng theo Role (BR02)
            var responseData = new LoginResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                FPoints = user.FPoints
            };

            return ApiResponse<LoginResponseDto>.Ok(responseData, "Đăng nhập thành công!");
        }
    }
}