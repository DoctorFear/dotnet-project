// AncientBook.Application/Interfaces/IAuthService.cs
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs.Auth;

namespace AncientBook.Application.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request);
        Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request); 
        Task<ApiResponse<RegisterResponseDto>> GoogleLoginAsync(GoogleLoginRequestDto request);
        Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request);

    }
}