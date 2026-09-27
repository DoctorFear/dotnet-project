using AncientBook.Application.Common;
using AncientBook.Application.DTOs.User;

namespace AncientBook.Application.Interfaces;

public interface IUserService
{
    Task<ApiResponse<UserProfileResponseDto>> GetProfileAsync(int userId);
    Task<ApiResponse<bool>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
    Task<ApiResponse<bool>> SetPasswordAsync(int userId, SetPasswordRequestDto request);
}