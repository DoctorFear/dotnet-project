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
        private readonly IEmailService _emailService;

        public AuthService(IUserRepository userRepository, IPasswordHasher passwordHasher, IEmailService emailService)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _emailService = emailService;   
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
        public async Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            // E1: Kiểm tra tính hợp lệ cơ bản
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email))
            {
                return ApiResponse<bool>.Fail("Tên đăng nhập và Email không được để trống.");
            }

            // Bước 5: Kiểm tra cặp Tên đăng nhập và Email có cùng thuộc về 1 tài khoản không
            var user = await _userRepository.GetByUsernameAsync(request.Username);

            // A1: Chống dò quét tài khoản (Dù sai hay đúng email/username đều trả về một thông báo chung thành công ở bước 7)
            if (user == null || !user.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                // Vẫn trả về true (thành công giả lập) để kẻ xấu không dò ra tài khoản nào tồn tại thực tế trong hệ thống
                return ApiResponse<bool>.Ok(true, "Nếu thông tin chính xác, liên kết đặt lại mật khẩu đã được gửi về email của bạn.");
            }

            // Bước 6: Tạo mã xác thực ngẫu nhiên (hoặc JWT Reset Token) có thời hạn 15 phút (BR02)
            var resetToken = Guid.NewGuid().ToString();
            user.PasswordResetToken = resetToken;
            user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(15); // Hạn đúng 15 phút

            await _userRepository.SaveChangesAsync();

            // Gửi email chứa liên kết (Ví dụ: https://yourdomain.com/reset-password?token=...)
            try
            {
                string resetLink = $"https://localhost:7001/api/auth/reset-password?token={resetToken}";
                string emailBody = $"Chào {user.FullName},<br>Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng bấm vào liên kết sau để đặt lại mật khẩu (có hiệu lực trong 15 phút): <a href='{resetLink}'>Đặt lại mật khẩu</a>";

                await _emailService.SendEmailAsync(user.Email, "Khôi phục mật khẩu hệ thống", emailBody);
            }
            catch (Exception)
            {
                // E2: Lỗi gửi email
                return ApiResponse<bool>.Fail("Lỗi gián đoạn dịch vụ gửi email. Vui lòng thử lại sau.");
            }

            return ApiResponse<bool>.Ok(true, "Liên kết đặt lại mật khẩu đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.");
        }

        public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            // E3: Kiểm tra token có tồn tại không
            var user = await _userRepository.GetByResetTokenAsync(request.Token);
            if (user == null || user.ResetTokenExpires < DateTime.UtcNow)
            {
                return ApiResponse<bool>.Fail("Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu mới.");
            }

            // E4 & BR04: Kiểm tra quy tắc mật khẩu mới (tối thiểu 6 ký tự, trùng khớp xác nhận)
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return ApiResponse<bool>.Fail("Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên.");
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return ApiResponse<bool>.Fail("Mật khẩu xác nhận không trùng khớp.");
            }

            // Bước 12 & BR03: Cập nhật mật khẩu mới, HỦY MẬT KHẨU CŨ, vô hiệu hóa token ngay lập tức (dùng 1 lần duy nhất)
            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.PasswordResetToken = null; // Xóa token để không bao giờ dùng lại được nữa (BR02)
            user.ResetTokenExpires = null;

            // (Nếu hệ thống có bảng lưu phiên đăng nhập hoặc refreshToken, bạn sẽ tiến hành Revoke/Xóa toàn bộ phiên cũ của user này tại đây theo BR03)

            await _userRepository.SaveChangesAsync();

            // Bước 13: Ghi nhận Audit Log (nếu có service log)
            // _auditLogService.Log(user.Id, "Đổi mật khẩu thành công qua tính năng Quên mật khẩu");

            return ApiResponse<bool>.Ok(true, "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        }
    }
}