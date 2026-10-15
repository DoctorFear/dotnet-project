using AncientBook.Application.Common;
using AncientBook.Application.DTOs.User;
using System.Threading.Tasks;

namespace AncientBook.Application.Interfaces;

public interface IUserService
{
    Task<ApiResponse<UserProfileResponseDto>> GetProfileAsync(int userId);
    Task<ApiResponse<UserProfileResponseDto>> UpdateProfileAsync(int userId, UpdateProfileRequestDto request);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequestDto request, string? ipAddress = null);
}