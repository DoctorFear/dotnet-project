using AncientBook.Application.Common;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.DTOs.Auth;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace AncientBook.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IEmailService _emailService;
        private readonly ITokenService _tokenService;
        private readonly IAuditLogService _auditLogService;

        public AuthService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IEmailService emailService,
            ITokenService tokenService,
            IAuditLogService auditLogService)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
            _tokenService = tokenService;
            _auditLogService = auditLogService;
        }

        public async Task<ApiResponse<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request)
        {
            // 1. Kiểm tra Username (bắt buộc duy nhất)
            if (await _userRepository.ExistsByUsernameAsync(request.Username))
            {
                return ApiResponse<RegisterResponseDto>.Fail("Tên đăng nhập đã tồn tại trên hệ thống.");
            }

            // 2. BỎ bước kiểm tra ExistsByEmailAsync ở đây để cho phép trùng Email

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

        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, string? ipAddress = null)
        {
            var user = await _userRepository.GetByUsernameAsync(request.Username);

            if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return ApiResponse<LoginResponseDto>.Fail("Tên đăng nhập hoặc mật khẩu không chính xác.");
            }

            if (!user.IsActive)
            {
                return ApiResponse<LoginResponseDto>.Fail("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
            }

            var refreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(3);
            await _userRepository.SaveChangesAsync();

            var accessToken = _tokenService.GenerateAccessToken(user);

            // =========================================================================
            // ĐIỀU KIỆN AUDIT LOG:
            // Chỉ ghi nhận khi Admin / Staff / Shipper đăng nhập thành công.
            // Khách hàng (Member) đăng nhập: BỎ QUA HOÀN TOÀN
            // =========================================================================
            if (user.Role != UserRole.Member)
            {
                await _auditLogService.LogAsync(
                    action: "LOGIN",
                    module: "AUTH",
                    entityName: "Users",
                    recordId: user.Id.ToString(),
                    oldValues: null,
                    newValues: null,
                    details: $"Tài khoản nội bộ @{user.Username} ({user.Role}) đăng nhập thành công vào hệ thống",
                    userId: user.Id,
                    ipAddress: ipAddress
                );
            }

            var responseData = new LoginResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                FPoints = user.FPoints,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };

            return ApiResponse<LoginResponseDto>.Ok(responseData, "Đăng nhập thành công!");
        }

        public async Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(string incomingRefreshToken)
        {
            var user = await _userRepository.GetByRefreshTokenAsync(incomingRefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return ApiResponse<LoginResponseDto>.Fail("Phiên đăng nhập đã hết hạn (quá 3 ngày không hoạt động). Vui lòng đăng nhập lại.");
            }

            var newRefreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(3);
            await _userRepository.SaveChangesAsync();

            var newAccessToken = _tokenService.GenerateAccessToken(user);

            var responseData = new LoginResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                FPoints = user.FPoints,
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            };

            return ApiResponse<LoginResponseDto>.Ok(responseData, "Làm mới phiên thành công!");
        }

        public async Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email))
            {
                return ApiResponse<bool>.Fail("Tên đăng nhập và Email không được để trống.");
            }

            var user = await _userRepository.GetByUsernameAsync(request.Username);

            if (user == null || !user.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<bool>.Ok(true, "Nếu thông tin chính xác, liên kết đặt lại mật khẩu đã được gửi về email của bạn.");
            }

            var resetToken = Guid.NewGuid().ToString();
            user.PasswordResetToken = resetToken;
            user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15);

            await _userRepository.SaveChangesAsync();

            try
            {
                string resetLink = $"http://localhost:5173/reset-password?token={resetToken}";
                string emailBody = $"Chào {user.FullName},<br>Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng bấm vào liên kết sau để đặt lại mật khẩu (có hiệu lực trong 15 phút): <a href='{resetLink}'>Đặt lại mật khẩu</a>";

                await _emailService.SendEmailAsync(user.Email, "Khôi phục mật khẩu hệ thống", emailBody);
            }
            catch (Exception)
            {
                return ApiResponse<bool>.Fail("Lỗi gián đoạn dịch vụ gửi email. Vui lòng thử lại sau.");
            }

            return ApiResponse<bool>.Ok(true, "Liên kết đặt lại mật khẩu đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.");
        }

        public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request, string? ipAddress = null)
        {
            var user = await _userRepository.GetByResetTokenAsync(request.Token);
            if (user == null || user.ResetTokenExpires < DateTime.UtcNow)
            {
                return ApiResponse<bool>.Fail("Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu mới.");
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return ApiResponse<bool>.Fail("Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên.");
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return ApiResponse<bool>.Fail("Mật khẩu xác nhận không trùng khớp.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            await _userRepository.SaveChangesAsync();

            await _auditLogService.LogAsync(
                action: "RESET_PASSWORD",
                module: "AUTH",
                entityName: "Users",
                recordId: user.Id.ToString(),
                oldValues: "***",
                newValues: "***",
                details: $"Tài khoản @{user.Username} ({user.Role}) đã đặt lại mật khẩu thành công qua Quên mật khẩu",
                userId: user.Id,
                ipAddress: ipAddress
            );

            return ApiResponse<bool>.Ok(true, "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        }

        public async Task<ApiResponse<bool>> LogoutAsync(int userId, string? ipAddress = null)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.Fail("Không tìm thấy người dùng.");
            }

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _userRepository.SaveChangesAsync();   
            return ApiResponse<bool>.Ok(true, "Đăng xuất thành công.");
        }
    }
}