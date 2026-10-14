using AncientBook.Application.Common;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.DTOs.User;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace AncientBook.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditLogService _auditLogService;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _auditLogService = auditLogService;
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

    public async Task<ApiResponse<UserProfileResponseDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request)
    {
        // 1. Kiểm tra BR02: Họ tên không để trống
        if (string.IsNullOrWhiteSpace(request.FullName))
            return ApiResponse<UserProfileResponseDto>.Fail("Họ và tên không được để trống.");

        // [MỚI] Kiểm tra Email không để trống và đúng định dạng
        if (string.IsNullOrWhiteSpace(request.Email))
            return ApiResponse<UserProfileResponseDto>.Fail("Email không được để trống.");

        if (!Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return ApiResponse<UserProfileResponseDto>.Fail("Địa chỉ email không đúng định dạng.");

        // Kiểm tra BR02: Số điện thoại chuẩn VN (10 chữ số, đầu 03, 05, 07, 08, 09)
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || !Regex.IsMatch(request.PhoneNumber, @"^(0[3|5|7|8|9])[0-9]{8}$"))
            return ApiResponse<UserProfileResponseDto>.Fail("Số điện thoại không hợp lệ (phải đủ 10 chữ số).");

        var user = await _userRepository.GetByIdWithAddressesAsync(userId);
        if (user == null)
            return ApiResponse<UserProfileResponseDto>.Fail("Không tìm thấy người dùng.");

        // [CẬP NHẬT TẠI ĐÂY] Cho phép đổi Email, giữ nguyên Username (không check trùng Email vì chấp nhận dùng chung)
        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();
        user.Email = request.Email.Trim().ToLower();

        // 2. Xử lý địa chỉ nhận hàng theo Role (BR04)
        if (user.Role == UserRole.Member)
        {
            var addresses = request.Addresses ?? new List<AddressDto>();

            // BR04: Tối đa 2 địa chỉ
            if (addresses.Count > 2)
                return ApiResponse<UserProfileResponseDto>.Fail("Khách hàng chỉ được lưu tối đa 2 địa chỉ nhận hàng.");

            // Kiểm tra tính hợp lệ của từng địa chỉ (E1)
            for (int i = 0; i < addresses.Count; i++)
            {
                var addr = addresses[i];
                if (string.IsNullOrWhiteSpace(addr.Province))
                    return ApiResponse<UserProfileResponseDto>.Fail($"Vui lòng chọn Tỉnh/Thành phố cho Địa chỉ {i + 1}.");
                if (string.IsNullOrWhiteSpace(addr.Ward))
                    return ApiResponse<UserProfileResponseDto>.Fail($"Vui lòng chọn Phường/Xã cho Địa chỉ {i + 1}.");
                if (string.IsNullOrWhiteSpace(addr.StreetAddress))
                    return ApiResponse<UserProfileResponseDto>.Fail($"Vui lòng nhập Số nhà tên đường cho Địa chỉ {i + 1}.");
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

        var response = new UserProfileResponseDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName ?? string.Empty,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            Role = user.Role.ToString(),
            Addresses = user.Addresses?.Select(a => new AddressDto
            {
                Id = a.Id,
                Province = a.Province,
                Ward = a.Ward,
                StreetAddress = a.StreetAddress,
                IsDefault = a.IsDefault
            }).ToList() ?? new List<AddressDto>()
        };

        return ApiResponse<UserProfileResponseDto>.Ok(response, "Cập nhật hồ sơ thành công!");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request, string? ipAddress = null)
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

        await _auditLogService.LogAsync(
            action: "CHANGE_PASSWORD",
            module: "USER",
            entityName: "Users",
            recordId: user.Id.ToString(),
            oldValues: "***",
            newValues: "***",
            details: $"Tài khoản @{user.Username} ({user.Role}) đã đổi mật khẩu thành công",
            userId: user.Id,
            ipAddress: ipAddress
        );

        return ApiResponse<bool>.Ok(true, "Đổi mật khẩu thành công!");
    }
}