using AncientBook.Application.Common;
using AncientBook.Application.Common.Interfaces;
    using AncientBook.Application.DTOs.User;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using System.Net;
using System.Text.RegularExpressions;

namespace AncientBook.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<UserProfileResponseDto>> GetProfileAsync(int userId)
    {
        var user = await _userRepository.GetByIdWithAddressesAsync(userId);
        if (user == null)
            return ApiResponse<UserProfileResponseDto>.Fail("Không tìm thấy người dùng.");

        var response = new UserProfileResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName ?? string.Empty,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            Role = user.Role.ToString(),
            HasPassword = !string.IsNullOrWhiteSpace(user.PasswordHash),
            Addresses = user.Addresses?.Select(a => new AddressDto
            {
                Id = a.Id,
                Province = a.Province,
                Ward = a.Ward,
                StreetAddress = a.StreetAddress,
                IsDefault = a.IsDefault
            }).ToList() ?? new List<AddressDto>()
        };

        return ApiResponse<UserProfileResponseDto>.Ok(response);
    }

    public async Task<ApiResponse<bool>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
    {
        // 1. Kiểm tra BR02: Họ tên không để trống
        if (string.IsNullOrWhiteSpace(request.FullName))
            return ApiResponse<bool>.Fail("Họ và tên không được để trống.");

        // Kiểm tra BR02: Số điện thoại chuẩn VN (10 chữ số, đầu 03, 05, 07, 08, 09)
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || !Regex.IsMatch(request.PhoneNumber, @"^(0[3|5|7|8|9])[0-9]{8}$"))
            return ApiResponse<bool>.Fail("Số điện thoại không hợp lệ (phải đủ 10 chữ số).");

        var user = await _userRepository.GetByIdWithAddressesAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("Không tìm thấy người dùng.");

        // Cập nhật thông tin cá nhân (BR01: Username & Email không bị thay đổi)
        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();

        // 2. Xử lý địa chỉ nhận hàng theo Role (BR04)
        if (user.Role.ToString() == "Member")
        {
            var addresses = request.Addresses ?? new List<AddressDto>();

            // BR04: Tối đa 2 địa chỉ
            if (addresses.Count > 2)
                return ApiResponse<bool>.Fail("Khách hàng chỉ được lưu tối đa 2 địa chỉ nhận hàng.");

            // Kiểm tra tính hợp lệ của từng địa chỉ (E1)
            for (int i = 0; i < addresses.Count; i++)
            {
                var addr = addresses[i];
                if (string.IsNullOrWhiteSpace(addr.Province))
                    return ApiResponse<bool>.Fail($"Vui lòng chọn Tỉnh/Thành phố cho Địa chỉ {i + 1}.");
                if (string.IsNullOrWhiteSpace(addr.Ward))
                    return ApiResponse<bool>.Fail($"Vui lòng chọn Phường/Xã cho Địa chỉ {i + 1}.");
                if (string.IsNullOrWhiteSpace(addr.StreetAddress))
                    return ApiResponse<bool>.Fail($"Vui lòng nhập Số nhà tên đường cho Địa chỉ {i + 1}.");
            }

            // Đồng bộ dữ liệu địa chỉ
            user.Addresses.Clear();
            bool isFirst = true;
            foreach (var addr in addresses)
            {
                user.Addresses.Add(new Address
                {
                    UserId = user.Id,
                    Province = addr.Province.Trim(),
                    Ward = addr.Ward.Trim(),
                    StreetAddress = addr.StreetAddress.Trim(),
                    IsDefault = isFirst // Địa chỉ 1 là mặc định
                });
                isFirst = false;
            }
        }

        await _userRepository.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Thay đổi thành công!");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("Không tìm thấy người dùng.");

        if (string.IsNullOrEmpty(user.PasswordHash))
            return ApiResponse<bool>.Fail("Tài khoản chưa có mật khẩu. Vui lòng sử dụng tính năng Thiết lập mật khẩu.");

        // E2: Không bỏ trống
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
        {
            return ApiResponse<bool>.Fail("Vui lòng điền đầy đủ các thông tin mật khẩu.");
        }

        // E2: Khớp xác nhận
        if (request.NewPassword != request.ConfirmNewPassword)
            return ApiResponse<bool>.Fail("Mật khẩu xác nhận không trùng khớp.");

        // E3: Kiểm tra mật khẩu hiện tại
        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("Mật khẩu hiện tại không chính xác.");

        // E4: Mật khẩu mới >= 6 ký tự và khác mật khẩu cũ
        if (request.NewPassword.Length < 6)
            return ApiResponse<bool>.Fail("Mật khẩu mới phải từ 6 ký tự trở lên.");

        if (request.NewPassword == request.CurrentPassword)
            return ApiResponse<bool>.Fail("Mật khẩu mới phải khác mật khẩu hiện tại.");

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _userRepository.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Đổi mật khẩu thành công!");
    }

    public async Task<ApiResponse<bool>> SetPasswordAsync(int userId, SetPasswordRequestDto request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("Không tìm thấy người dùng.");

        // BR05: Chỉ dành cho tài khoản Google chưa có mật khẩu
        if (!string.IsNullOrEmpty(user.PasswordHash))
            return ApiResponse<bool>.Fail("Tài khoản đã có mật khẩu nội bộ. Vui lòng dùng chức năng Đổi mật khẩu.");

        // E5: Kiểm tra bỏ trống và xác nhận
        if (string.IsNullOrWhiteSpace(request.NewPassword) || string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
            return ApiResponse<bool>.Fail("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.");

        if (request.NewPassword != request.ConfirmNewPassword)
            return ApiResponse<bool>.Fail("Mật khẩu xác nhận không khớp.");

        if (request.NewPassword.Length < 6)
            return ApiResponse<bool>.Fail("Mật khẩu phải từ 6 ký tự trở lên.");

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _userRepository.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Thiết lập mật khẩu thành công!");
    }
}