    // AncientBook.Application/Interfaces/IAuthService.cs
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs.Auth;

namespace AncientBook.Application.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request);
        Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, string? ipAddress = null);
        Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request, string? ipAddress = null);
        Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(string refreshToken);
        Task<ApiResponse<bool>> LogoutAsync(int userId, string? ipAddress = null);

    }
}