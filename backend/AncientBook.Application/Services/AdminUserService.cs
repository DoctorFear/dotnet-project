using AncientBook.Application.Common;
using AncientBook.Application.Common.Interfaces;
using AncientBook.Application.DTOs.User;
using AncientBook.Application.Interfaces;
using AncientBook.Domain.Entities;
using AncientBook.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AncientBook.Application.Services;

public class AdminUserService : IAdminUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditLogService _auditLogService;

    public AdminUserService(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<PagedResult<UserManagementItemDto>>> GetUsersAsync(UserFilterDto filter)
    {
        var (items, total) = await _userRepository.GetPagedUsersAsync(filter);

        var dtos = items.Select(u => new UserManagementItemDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            FullName = u.FullName,
            PhoneNumber = u.PhoneNumber,
            Role = u.Role.ToString(),
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            // Đọc trực tiếp từ cột IsSuperAdmin trong database
            IsSuperAdmin = u.IsSuperAdmin
        }).ToList();

        var pagedResult = new PagedResult<UserManagementItemDto>(
            items: dtos,
            totalCount: total,
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize
        );

        return ApiResponse<PagedResult<UserManagementItemDto>>.Ok(pagedResult);
    }

    public async Task<ApiResponse<UserManagementItemDto>> CreateInternalUserAsync(int adminId, CreateInternalUserRequestDto request)
    {
        // BR02: Chỉ được tạo nhân sự nội bộ (Admin, Staff, Shipper)
        if (request.Role == UserRole.Member)
        {
            return ApiResponse<UserManagementItemDto>.Fail("Không thể tạo tài khoản Khách hàng từ biểu mẫu nội bộ.");
        }

        // E4: Kiểm tra trùng Username, Email, Số điện thoại
        if (await _userRepository.ExistsByUsernameAsync(request.Username.Trim()))
            return ApiResponse<UserManagementItemDto>.Fail("Tên đăng nhập đã tồn tại trong hệ thống.");

        if (await _userRepository.ExistsByEmailAsync(request.Email.Trim()))
            return ApiResponse<UserManagementItemDto>.Fail("Email này đã được sử dụng.");

        if (await _userRepository.ExistsByPhoneAsync(request.PhoneNumber.Trim()))
            return ApiResponse<UserManagementItemDto>.Fail("Số điện thoại này đã được sử dụng.");

        // Mật khẩu khởi tạo mặc định cho nhân sự mới
        string defaultPassword = "Password@123";
        var newUser = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim().ToLower(),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            PasswordHash = _passwordHasher.HashPassword(defaultPassword),
            Role = request.Role,
            IsActive = true,
            IsSuperAdmin = false, // Nhân sự mới tạo không bao giờ là Super Admin
            TokenVersion = 1,
            FPoints = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(newUser);
        await _userRepository.SaveChangesAsync();

        // BR05: Ghi nhận Audit Log
        await RecordAuditLogAsync(adminId, "CREATE_INTERNAL_USER", "Users", newUser.Id.ToString(),
            $"Tạo nhân sự mới: @{newUser.Username} với vai trò {newUser.Role}");

        var resultDto = new UserManagementItemDto
        {
            Id = newUser.Id,
            Username = newUser.Username,
            Email = newUser.Email,
            FullName = newUser.FullName,
            PhoneNumber = newUser.PhoneNumber,
            Role = newUser.Role.ToString(),
            IsActive = newUser.IsActive,
            CreatedAt = newUser.CreatedAt,
            IsSuperAdmin = false
        };

        return ApiResponse<UserManagementItemDto>.Ok(resultDto, $"Tạo tài khoản nhân sự @{newUser.Username} thành công!");
    }

    public async Task<ApiResponse<bool>> UpdateRoleAsync(int adminId, int targetUserId, ChangeUserRoleRequestDto request)
    {
        // E2: Chặn tự thao tác trên chính mình
        if (adminId == targetUserId)
        {
            return ApiResponse<bool>.Fail("Quản trị viên không được phép tự phân quyền lại cho chính mình.");
        }

        var targetUser = await _userRepository.GetByIdAsync(targetUserId);
        if (targetUser == null)
            return ApiResponse<bool>.Fail("Tài khoản người dùng không tồn tại.");

        // E1: Chặn phân vai trò cho Member
        if (targetUser.Role == UserRole.Member)
        {
            return ApiResponse<bool>.Fail("Tài khoản Khách hàng (Member) không được phép phân quyền nhân sự.");
        }

        // BR02: Vai trò mới chỉ thuộc 3 vai trò nội bộ
        if (request.NewRole == UserRole.Member)
        {
            return ApiResponse<bool>.Fail("Không thể chuyển vai trò nhân sự về Khách hàng.");
        }

        // E3: Chặn xâm phạm Super Admin dựa trên cột IsSuperAdmin trong DB
        if (targetUser.IsSuperAdmin)
        {
            return ApiResponse<bool>.Fail("Tài khoản Super Admin là bất khả xâm phạm.");
        }

        // E3: Chốt chặn duy trì tối thiểu 01 Quản trị viên hoạt động
        if (targetUser.Role == UserRole.Admin && request.NewRole != UserRole.Admin)
        {
            int activeAdmins = await _userRepository.CountActiveAdminsAsync();
            if (activeAdmins <= 1)
            {
                return ApiResponse<bool>.Fail("Hệ thống bắt buộc duy trì tối thiểu 01 Quản trị viên hoạt động.");
            }
        }

        var oldRole = targetUser.Role;
        targetUser.Role = request.NewRole;

        // BR04: Thu hồi phiên làm việc tức thì bằng cách tăng TokenVersion và hủy RefreshToken
        targetUser.TokenVersion++;
        targetUser.RefreshToken = null;
        targetUser.RefreshTokenExpiryTime = null;

        await _userRepository.SaveChangesAsync();

        // BR05: Ghi Audit Log
        await RecordAuditLogAsync(adminId, "CHANGE_ROLE", "Users", targetUser.Id.ToString(),
            $"Đã chuyển @{targetUser.Username} từ {oldRole} sang vai trò: {targetUser.Role}");

        return ApiResponse<bool>.Ok(true, $"Đã chuyển @{targetUser.Username} sang vai trò: {targetUser.Role}");
    }

    public async Task<ApiResponse<bool>> ToggleStatusAsync(int adminId, int targetUserId, ToggleUserStatusRequestDto request)
    {
        // E2: Chặn tự khóa chính mình
        if (adminId == targetUserId && !request.IsActive)
        {
            return ApiResponse<bool>.Fail("Quản trị viên không thể tự khóa tài khoản của chính mình.");
        }

        var targetUser = await _userRepository.GetByIdAsync(targetUserId);
        if (targetUser == null)
            return ApiResponse<bool>.Fail("Người dùng không tồn tại.");

        // E3: Chặn khóa Super Admin dựa trên cột IsSuperAdmin trong DB
        if (targetUser.IsSuperAdmin)
        {
            return ApiResponse<bool>.Fail("Không thể khóa tài khoản Super Admin.");
        }

        // E3: Chặn khóa Admin hoạt động cuối cùng
        if (!request.IsActive && targetUser.Role == UserRole.Admin)
        {
            int activeAdmins = await _userRepository.CountActiveAdminsAsync();
            if (activeAdmins <= 1)
            {
                return ApiResponse<bool>.Fail("Hệ thống bắt buộc duy trì tối thiểu 01 Quản trị viên hoạt động.");
            }
        }

        targetUser.IsActive = request.IsActive;

        // BR04: Nếu thao tác là KHÓA, lập tức hủy phiên làm việc
        if (!request.IsActive)
        {
            targetUser.TokenVersion++;
            targetUser.RefreshToken = null;
            targetUser.RefreshTokenExpiryTime = null;
        }

        await _userRepository.SaveChangesAsync();

        string actionName = request.IsActive ? "UNLOCK_USER" : "LOCK_USER";
        string statusText = request.IsActive ? "Mở khóa" : "Khóa";

        // BR05: Ghi Audit Log
        await RecordAuditLogAsync(adminId, actionName, "Users", targetUser.Id.ToString(),
            $"{statusText} tài khoản @{targetUser.Username}");

        return ApiResponse<bool>.Ok(true, $"{statusText} tài khoản @{targetUser.Username} thành công!");
    }

    private async Task RecordAuditLogAsync(int adminId, string action, string entityName, string recordId, string details)
    {
        await _auditLogService.LogAsync(
            action: action,
            module: "AUTH",
            entityName: entityName,
            recordId: recordId,
            oldValues: null,
            newValues: null,
            details: details,
            userId: adminId
        );
    }
}