using AncientBook.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AncientBook.Application.DTOs.User;

// Query lọc & phân trang danh sách người dùng
public class UserFilterDto
{
    public string? Keyword { get; set; }
    public UserRole? Role { get; set; }
    public bool? IsActive { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

// Model trả về cho từng dòng trong bảng Quản lý
public class UserManagementItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsSuperAdmin { get; set; } // Phục vụ E3 phía UI
}

// Request tạo nhân sự mới (A2)
public class CreateInternalUserRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập không được để trống.")]
    [RegularExpression(@"^\S+$", ErrorMessage = "Tên đăng nhập không được chứa khoảng trắng.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email không được để trống.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ và tên không được để trống.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại không được để trống.")]
    [RegularExpression(@"^(0[3|5|7|8|9])[0-9]{8}$", ErrorMessage = "Số điện thoại phải đủ 10 chữ số hợp lệ.")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vai trò nội bộ.")]
    public UserRole Role { get; set; } // BR02: Chỉ Admin, Staff, Shipper
}

// Request chuyển đổi vai trò
public class ChangeUserRoleRequestDto
{
    [Required(ErrorMessage = "Vui lòng chọn vai trò mới.")]
    public UserRole NewRole { get; set; }
}

// Request Khóa / Mở khóa
public class ToggleUserStatusRequestDto
{
    public bool IsActive { get; set; }
}

