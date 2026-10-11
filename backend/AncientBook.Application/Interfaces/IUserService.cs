using AncientBook.Application.Common;
using AncientBook.Application.DTOs.User;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces;

public interface IUserService
{
    Task<ApiResponse<UserProfileResponseDto>> GetProfileAsync(int userId);
    Task<ApiResponse<bool>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request, string? ipAddress = null);
    Task<ApiResponse<bool>> SetPasswordAsync(int userId, SetPasswordRequestDto request, string? ipAddress = null);
}