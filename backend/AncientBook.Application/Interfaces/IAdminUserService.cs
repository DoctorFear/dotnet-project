using AncientBook.Application.Common;
using AncientBook.Application.DTOs.User;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces;

public interface IAdminUserService
{
    Task<ApiResponse<PagedResult<UserManagementItemDto>>> GetUsersAsync(UserFilterDto filter);
    Task<ApiResponse<UserManagementItemDto>> CreateInternalUserAsync(int adminId, CreateInternalUserRequestDto request, string? ipAddress = null);
    Task<ApiResponse<bool>> UpdateRoleAsync(int adminId, int targetUserId, ChangeUserRoleRequestDto request, string? ipAddress = null);
    Task<ApiResponse<bool>> ToggleStatusAsync(int adminId, int targetUserId, ToggleUserStatusRequestDto request, string? ipAddress = null);
}