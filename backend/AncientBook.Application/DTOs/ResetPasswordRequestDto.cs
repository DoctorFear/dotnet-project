namespace AncientBook.Application.DTOs.Auth
{
    public class ResetPasswordRequestDto
    {
        public string Token { get; set; } = string.Empty; // Mã xác thực hoặc Token gửi qua email
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}