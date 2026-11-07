using System.ComponentModel.DataAnnotations;

namespace AncientBook.Application.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Họ và tên không được để trống")]
        [MaxLength(100)]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
        [MinLength(3, ErrorMessage = "Tên đăng nhập tối thiểu 3 ký tự")]
        [MaxLength(50)]
        public string Username { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không đúng định dạng")]
        public string Email { get; set; } = null!;

        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải có định dạng 10 chữ số (bắt đầu bằng 0)")]
        public string? PhoneNumber { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$", 
            ErrorMessage = "Mật khẩu từ 8 ký tự trở lên, gồm chữ hoa, chữ thường, số và tối thiểu 1 ký tự đặc biệt")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Xác nhận mật khẩu không được để trống")]
        [Compare("Password", ErrorMessage = "Mật khẩu xác nhận không trùng khớp")]
        public string ConfirmPassword { get; set; } = null!;
    }
}
