// AncientBook.Application/Interfaces/IAuthService.cs
using System.Threading.Tasks;
using AncientBook.Application.Common;
using AncientBook.Application.DTOs.Auth;

namespace AncientBook.Application.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<RegisterResponseDto>> RegisterAsync(RegisterRequestDto request);
        Task<ApiResponse<RegisterResponseDto>> GoogleLoginAsync(GoogleLoginRequestDto request);
    }
}