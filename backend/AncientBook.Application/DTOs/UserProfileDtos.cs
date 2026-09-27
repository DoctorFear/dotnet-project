namespace AncientBook.Application.DTOs.User;

public class AddressDto
{
    public int? Id { get; set; }
    public string Province { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class UserProfileResponseDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool HasPassword { get; set; } // Phân biệt tài khoản thường hay Google
    public List<AddressDto> Addresses { get; set; } = new();
}

public class UpdateProfileRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public List<AddressDto>? Addresses { get; set; } = new();
}

public class ChangePasswordRequestDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmNewPassword { get; set; } = string.Empty;
}

public class SetPasswordRequestDto
{
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmNewPassword { get; set; } = string.Empty;
}