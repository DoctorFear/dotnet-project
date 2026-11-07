using System.ComponentModel.DataAnnotations;

namespace AncientBook.Application.DTOs.Auth
{
    public class ResetPasswordRequestDto
    {
        [Required(ErrorMessage = "Mã token xác thực không được để trống")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
            ErrorMessage = "Mật khẩu từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, số và tối thiểu 1 ký tự đặc biệt")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Xác nhận mật khẩu không được để trống")]
        [Compare(nameof(NewPassword), ErrorMessage = "Mật khẩu xác nhận không trùng khớp")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
