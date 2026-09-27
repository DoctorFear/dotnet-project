using AncientBook.Application.Common;
using AncientBook.Application.DTOs.User;

namespace AncientBook.Application.Interfaces;

public interface IAdminUserService
{
    Task<ApiResponse<PagedResult<UserManagementItemDto>>> GetUsersAsync(UserFilterDto filter);
    Task<ApiResponse<UserManagementItemDto>> CreateInternalUserAsync(int adminId, CreateInternalUserRequestDto request);
    Task<ApiResponse<bool>> UpdateRoleAsync(int adminId, int targetUserId, ChangeUserRoleRequestDto request);
    Task<ApiResponse<bool>> ToggleStatusAsync(int adminId, int targetUserId, ToggleUserStatusRequestDto request);
}